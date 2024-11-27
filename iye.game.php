<?php

/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * iye implementation : © Mustafa Yilmaz - musyilmaz.dev@gmail.com
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 */

declare(strict_types=1);

require_once(APP_GAMEMODULE_PATH . "module/table/table.game.php");


define("STATE_GAME_SETUP", 1);
define("STATE_PREPARE_NEW_ROUND", 2);
define("STATE_MAKE_LAST_LOSER_ACTIVE_PLAYER", 3);
define("STATE_DETERMINE_ACTIVE_PLAYER", 5);
define("STATE_PLAYER_MOVE_KAM", 10);
define("STATE_NEXT_PLAYER", 20);
define("STATE_PREPARE_ROUND_END", 90);
define("STATE_ROUND_END_CONFIRMATION", 91);
define("STATE_PREPARE_GAME_END", 98);
define("STATE_GAME_END", 99);

class iye extends Table
{
    /**
     * Your global variables labels:
     *
     * Here, you can assign labels to global variables you are using for this game. You can use any number of global
     * variables with IDs between 10 and 99. If your game has options (variants), you also have to associate here a
     * label to the corresponding ID in `gameoptions.inc.php`.
     *
     * NOTE: afterward, you can get/set the global variables with `getGameStateValue`, `setGameStateInitialValue` or
     * `setGameStateValue` functions.
     */
    public function __construct()
    {
        parent::__construct();

        $this->initGameStateLabels([]);
    }

    protected function getGameName()
    {
        return "iye";
    }

    public function getGameProgression()
    {
        $board_state = $this->getTokenBoardStateFromDB();
        return ($this->game_length - count($board_state)) * 100 / $this->game_length;
    }

    /**
     * Setup New Game
     *
     * Fires only once for setting up a new game
     */
    protected function setupNewGame($players, $options = [])
    {
        // Set the colors of the players with HTML color code. The default below is red/green/blue/orange/brown. The
        // number of colors defined here must correspond to the maximum number of players allowed for the gams.
        $gameinfos = $this->getGameinfos();
        $default_colors = $gameinfos['player_colors'];

        foreach ($players as $player_id => $player) {
            // Now you can access both $player_id and $player array
            $query_values[] = vsprintf("('%s', '%s', '%s', '%s', '%s')", [
                $player_id,
                array_shift($default_colors),
                $player["player_canal"],
                addslashes($player["player_name"]),
                addslashes($player["player_avatar"]),
            ]);
        }

        // Create players based on generic information.
        //
        // NOTE: You can add extra field on player table in the database (see dbmodel.sql) and initialize
        // additional fields directly here.
        static::DbQuery(
            sprintf(
                "INSERT INTO player (player_id, player_color, player_canal, player_name, player_avatar) VALUES %s",
                implode(",", $query_values)
            )
        );

        $this->reattributeColorsBasedOnPreferences($players, $gameinfos["player_colors"]);
        $this->reloadPlayersBasicInfos();

        // Init global values with their initial values.

        // Init game statistics.
        $this->initStat("player", "basicMovement", 0);
        $this->initStat("player", "sunMovement", 0);
        $this->initStat("player", "horseMovement", 0);
        $this->initStat("player", "treeMovement", 0);
        $this->initStat("player", "waterMovement", 0);
        $this->initStat("player", "owlMovement", 0);

        // Activate first player once everything has been initialized and ready.
        $this->activeNextPlayer();
    }

    /*
     * Gather all information about current game situation (visible by the current player).
     *
     * The method is called each time the game interface is displayed to a player, i.e.:
     *
     * - when the game starts
     * - when a player refreshes the game page (F5)
     */
    protected function getAllDatas()
    {
        $result = [];

        // WARNING: We must only return information visible by the current player.
        $current_player_id = (int) $this->getCurrentPlayerId();

        // Get information about players.
        // NOTE: you can retrieve some extra field you added for "player" table in `dbmodel.sql` if you need it.
        $result["players"] = $this->getCollectionFromDb(
            "SELECT player_id, player_score score FROM player"
        );

        $material_info = array(
            "tokenTypes" => $this->token_types,
            "kam" => $this->kam,
            "board" => $this->board
        );
        $result["materialInfo"] = $material_info;

        $token_state_from_db = $this->getTokenStateFromDB();
        $result["tokenState"] = $this->groupBy($token_state_from_db, "location");

        $result["playerTokenState"] = $this->getPlayerTokenStateFromDB();
        $result["playerRoundScores"] = $this->getCompletedGameRoundHistory();

        return $result;
    }

    public function actDetermineActivePlayer(int $player_id)
    {
        $this->notifyAllPlayers(
            "determineActivePlayer",
            clienttranslate('${playerName} will start new round'),
            array('playerName' => $this->getPlayerNameById($player_id))
        );
        if ($this->getActivePlayerId() === strval($player_id)) {
            $this->gamestate->nextState("movePlayerTurns");
        } else {
            $this->gamestate->nextState("nextPlayer");
        }
    }

    public function argDetermineActivePlayer(): array
    {
        return [
            "playerInformations" => $this->loadPlayersBasicInfos()
        ];
    }

    /**
     * Player Action :: playerMoveKam
     *
     * Writes player action of kam movement to DB in proper places
     * Handle effects like spending token, giving token to opponent
     * Notify all players about the applied movement
     */
    public function actPlayerMoveKam(int $x, int $y, string $spent_token)
    {
        $player_id = intval($this->getActivePlayerId());
        $opponent_id = $this->getOpponentId($player_id);
        $target_token = $this->getTokenAtCoordinate($x, $y);


        $this->updateKamPositionInDB($x, $y);
        $this->updateTokenPositionToPlayerId($x, $y, $opponent_id);
        if ($spent_token !== "basic") {
            $this->removeSpentTokenFromPlayerId($spent_token, $player_id);
        }

        $tokenState = $this->getTokenStateFromDB();

        $player_scores = $this->calculatePlayerScores();

        $this->notifyAllPlayers(
            "playerTurn",
            $spent_token === "basic" ?
                clienttranslate('${playerName} moves kam with basic movement. ${opponentName} receives ${logTargetToken}.') :
                clienttranslate('${playerName} moves kam with ${logSpentToken}. ${opponentName} receives ${logTargetToken}.'),
            array(
                'playerId' => $player_id,
                'playerName' => $this->getActivePlayerName(),
                'opponentId' => $opponent_id,
                'opponentName' => $this->getPlayerNameById($opponent_id),
                'x' => $x,
                'y' => $y,
                'logTargetToken' => $target_token["type"],
                'logSpentToken' => $spent_token,
                'spentToken' => $spent_token,
                'targetToken' => $target_token,
                'tokenState' => $tokenState,
                'tokenTypes' => $this->token_types,
                'players' => $this->loadPlayersBasicInfos(),
                'tokenState' => $this->groupBy($this->getTokenStateFromDB(), "location"),
                'playerTokenState' => $this->getPlayerTokenStateFromDB(),
                'playerScores' => $player_scores,
                'playerRoundScores' => $this->getCompletedGameRoundHistory(),
            )
        );

        $this->incStat(1, $this->getMovementStatName($spent_token), $player_id);

        $this->gamestate->nextState("nextPlayer");
    }

    /**
     * Game State :: STATE_PLAYER_MOVE_KAM
     *
     * Returns possible coordinates for active player to client side
     */
    public function argPlayerMoveKam(): array
    {
        return [
            "possibleCoordinates" => $this->getPossibleKamMovements(intval($this->getActivePlayerId())),
            "kamCoordinate" => $this->getKamCoordinate(),
        ];
    }

    public function actRoundEndConfirmation()
    {
        $player_id = $this->getCurrentPlayerId();
        $this->gamestate->setPlayerNonMultiactive($player_id, "newRound");
    }

    public function argRoundEndConfirmation(): array
    {
        return [];
    }

    public function stMultiPlayerInit(): void
    {
        $players = $this->loadPlayersBasicInfos();
        $completed_game_rounds = $this->getCompletedGameRoundHistory();
        $last_game_round = end($completed_game_rounds);
        $last_game_round_information = [
            $last_game_round["player_1"] => $last_game_round["player_1_score"],
            $last_game_round["player_2"] => $last_game_round["player_2_score"]
        ];

        $table_round_end[] = [
            "Player Name",
            "Round Score",
        ];

        foreach ($players as $player_id => $player) {
            $player_name_cell = [
                'str' => '${player_name}',
                'args' => ['player_name' => $player['player_name']],
            ];

            array_push($table_round_end, [
                $player_name_cell,
                strval($last_game_round_information[$player_id]),
            ]);
        };

        $this->notifyAllPlayers(
            "tableWindow",
            '',
            array(
                "id" => 'roundScoring',
                "title" => clienttranslate("End of Round"),
                "table" => $table_round_end,
                "footer" => $last_game_round["win_condition"] = "natural" ? clienttranslate("Round ended with natural scoring") : clienttranslate("Round ended with a player has no possible kam movements"),
                "closing" => clienttranslate("Close")
            )
        );

        $this->gamestate->setAllPlayersMultiactive();
    }

    public function stPrepareNewRound(): void
    {
        $this->setupNewGameRound();

        $this->notifyAllPlayers("newRound", clienttranslate("A new round is beginning."), array(
            'activePlayer' => $this->getActivePlayerId(),
            'players' => $this->loadPlayersBasicInfos(),
            'tokenTypes' => $this->token_types,
            'tokenState' => $this->groupBy($this->getTokenStateFromDB(), "location"),
            'playerScores' => $this->calculatePlayerScores(),
            'playerTokenState' => $this->getPlayerTokenStateFromDB(),
            'playerRoundScores' => $this->getCompletedGameRoundHistory()
        ));

        $completed_game_rounds = $this->getCompletedGameRoundHistory();

        if (count($completed_game_rounds) > 0) {
            $this->gamestate->nextState("makeLastLoserActivePlayer");
        } else {
            $this->gamestate->nextState("movePlayerTurns");
        }
    }

    public function stMakeLastLoserActivePlayer(): void
    {

        $last_round_winner = $this->getLastRoundWinnerPlayerId();

        if ($last_round_winner === "tie") {
            $this->notifyAllPlayers(
                "noActivePlayerChangeDueToTie",
                clienttranslate('Last round completed with a tie, game will continue as intended.'),
                array()
            );

            $this->gamestate->nextState("movePlayerTurns");
        } else {
            $this->gamestate->changeActivePlayer($this->getOpponentId(intval($last_round_winner)));

            $this->notifyAllPlayers(
                "makeLastLoserActivePlayer",
                clienttranslate('Loser of last round (${playerName}) must select who to start new round.'),
                array(
                    'playerName' => $this->getActivePlayerName()
                )
            );

            $this->gamestate->nextState("determineActivePlayer");
        }
    }

    /**
     * Game State :: STATE_NEXT_PLAYER
     * This is an automated game state
     *
     * Switches activePlayer & checks for endgame condition
     */
    public function stNextPlayer(): void
    {
        // Retrieve the active player ID.
        $player_id = (int)$this->getActivePlayerId();

        // Give some extra time to the active player when he completed an action
        $this->giveExtraTime($player_id);

        $this->activeNextPlayer();

        $possible_kam_movements = $this->getPossibleKamMovements(intval($this->getActivePlayerId()));
        $token_board_state = $this->getTokenBoardStateFromDB();

        if (empty($possible_kam_movements) || count($token_board_state) === 1) {
            $this->gamestate->nextState("prepareRoundEnd");
        } else {
            $this->gamestate->nextState("nextTurn");
        }
    }

    public function stPrepareRoundEnd(): void
    {
        $this->updateDBForCurrentGameRound();
        $this->handleRoundEndNotifications();
        $this->handleRoundEndStateChange();
    }

    public function stPrepareGameEnd(): void
    {
        $this->updatePlayerScoresToRepresentGameEnd();
        $this->handleGameEndNotifications();
    }

    /**
     * Migrate database.
     *
     * You don't have to care about this until your game has been published on BGA. Once your game is on BGA, this
     * method is called everytime the system detects a game running with your old database scheme. In this case, if you
     * change your database scheme, you just have to apply the needed changes in order to update the game database and
     * allow the game to continue to run with your new version.
     *
     * @param int $from_version
     * @return void
     */
    public function upgradeTableDb($from_version)
    {
        //       if ($from_version <= 1404301345)
        //       {
        //            // ! important ! Use DBPREFIX_<table_name> for all tables
        //
        //            $sql = "ALTER TABLE DBPREFIX_xxxxxxx ....";
        //            $this->applyDbUpgradeToAllDB( $sql );
        //       }
        //
        //       if ($from_version <= 1405061421)
        //       {
        //            // ! important ! Use DBPREFIX_<table_n
        //       }ame> for all tables
        //
        //            $sql = "CREATE TABLE DBPREFIX_xxxxxxx ....";
        //            $this->applyDbUpgradeToAllDB( $sql );
    }

    /********************
     * UTILITY FUNCTIONS
     */

    protected function setupNewGameRound()
    {
        $this->truncateTokenTable();
        $this->createNewGameRound();
        $this->resetPlayerScoresFromDB();

        $new_round_tokens = $this->setupInitialTokens();

        $sql = "INSERT INTO token (type, location, x, y) VALUES ";
        $sql .= implode(",", $new_round_tokens);
        $this->DbQuery($sql);
    }
    protected function truncateTokenTable()
    {
        $this->DbQuery("DELETE FROM token");
    }

    protected function createNewGameRound()
    {
        $player_ids = $this->getPlayerIds();
        $sql = "INSERT INTO gameround (winner, win_condition, is_current, player_1, player_1_score, player_2, player_2_score) VALUES (null, null, true, $player_ids[0], null, $player_ids[1], null)";
        $this->DbQuery($sql);
    }

    protected function setupInitialTokens()
    {
        $tokens = array();
        $sql_values = array();

        foreach (array_keys($this->token_types) as $token_type) {
            $amount = $this->token_types[$token_type]["amount"];
            $type = $this->token_types[$token_type]["type"];
            array_push($tokens, ...array_fill(0, $amount, $type));
        }

        shuffle($tokens);

        foreach ($tokens as $index => $token) {
            $x = $index % $this->board["row"]["size"];
            $y = floor($index / $this->board["column"]["size"]);
            $sql_values[] = "('$token', 'board', $x, $y)";
        };

        $kam_type = $this->kam["type"];
        $kam_start_x = $this->kam["start_x"];
        $kam_start_y = $this->kam["start_y"];

        $sql_values[] = "('$kam_type', 'board', $kam_start_x, $kam_start_y)";

        return $sql_values;
    }

    protected function getKamCoordinate()
    {
        return $this->getKamPositionFromDB();
    }

    /**
     * Generates possible kam movements for active player
     * Contains x,y coordinates along with possible discardable tokens.
     *
     * @param $player_id active_player
     * @return array of possible movements
     */
    protected function getPossibleKamMovements($player_id)
    {
        $results = array();

        $kam_position = $this->getKamPositionFromDB();
        $board_state = $this->getBoardStateFromDB();
        $allowed_movesets = $this->getAllowedMovesetsForPlayerBasedOnTokenTypes($player_id);

        foreach ($allowed_movesets as $moveset) {
            switch ($moveset) {
                case "sun":
                    $positions = $this->getSunMovesetCoordinates($board_state, $kam_position);
                    array_push($results, ...$positions);
                    break;
                case "horse":
                    $positions = $this->getHorseMovesetCoordinates($kam_position, $board_state);
                    array_push($results, ...$positions);
                    break;
                case "tree":
                    $positions = $this->getTreeMovesetCoordinates($kam_position, $board_state);
                    array_push($results, ...$positions);
                    break;
                case "water":
                    $positions = $this->getWaterMovesetCoordinates($kam_position, $board_state);
                    array_push($results, ...$positions);
                    break;
                case "owl":
                    $positions = $this->getOwlMovesetCoordinates($board_state, $kam_position);
                    array_push($results, ...$positions);
                    break;
                default:
                    $positions = $this->getBasicMovesetCoordinates($kam_position, $board_state);
                    array_push($results, ...$positions);
                    break;
            }
        }

        return array_values($this->generateReducedResultsBasedOnCoordinates($results));
    }

    /**
     * Retrieves x and y coordinates for kam token from DB
     *
     * @return tuple of kam x, kam y
     */
    protected function getKamPositionFromDB()
    {
        $kam_token_sql = "SELECT * FROM token where type='kam'";
        $kam_state = self::getObjectListFromDB($kam_token_sql)[0];

        $kam_pos_x = intval($kam_state["x"]);
        $kam_pos_y = intval($kam_state["y"]);

        return [$kam_pos_x, $kam_pos_y];
    }

    /**
     * Retrieves board state from tokens table in DB
     * returns values which resides in location=board
     * 
     * @return array of token table
     */
    protected function getBoardStateFromDB()
    {
        $board_state_sql = "SELECT * FROM token where location='board'";
        return self::getObjectListFromDB($board_state_sql);
    }

    protected function getTokenBoardStateFromDB()
    {
        $token_board_state_sql = "SELECT * FROM token WHERE location='board' AND NOT type='kam'";
        return self::getObjectListFromDB($token_board_state_sql);
    }

    /** 
     * Retrieves token state from DB
     */
    protected function getTokenStateFromDB()
    {
        $sql = "SELECT type type, location location, x x, y y FROM token";
        return self::getObjectListFromDB($sql);
    }

    protected function getPlayerTokenStateFromDB()
    {
        $sql = "SELECT * FROM token WHERE NOT location='board' AND NOT location='spent'";
        $player_token_state =  self::getObjectListFromDB($sql);

        return array_map(function ($row) {
            return ["player" => $row["location"], "type" => $row["type"]];
        }, $player_token_state);
    }

    /**
     * Retrieves possible movesets for player_id
     * return array will be shifted with "basic"
     *
     * @param player_id player_id for token retrieval
     * @return array of string of token_types along with basic
     */
    protected function getAllowedMovesetsForPlayerBasedOnTokenTypes($player_id)
    {
        $basic_moveset = array("basic");
        $player_token_state = self::getObjectListFromDB("SELECT * FROM token where location=$player_id");
        $player_token_types = array_keys($this->groupBy($player_token_state, "type"));

        return array_merge($basic_moveset, $player_token_types);
    }

    protected function generatePossibleCoordinatesByModification($kam_position, $movements)
    {
        $possible_coordinates = array();

        foreach ($movements as $movement) {
            $target_pos_x = $kam_position[0] + $movement[0];
            $target_pos_y = $kam_position[1] + $movement[1];
            array_push($possible_coordinates, $target_pos_x . $target_pos_y);
        }

        return $possible_coordinates;
    }

    protected function filterBoardStateForPossibleCoordinates($board_state, $possible_coordinates)
    {
        return array_filter($board_state, function ($coordinate) use ($possible_coordinates) {
            return in_array($coordinate["x"] . $coordinate["y"], $possible_coordinates, false);
        });
    }

    protected function generateMovesetPositionsFromFilteredBoardState($filtered_board_state, $movement_type)
    {
        return array_map(function ($item) use ($movement_type) {
            return ["x" => intval($item["x"]), "y" => intval($item["y"]), "movement" => $movement_type];
        }, $filtered_board_state);
    }

    /**
     * Generates coordinates for basic moveset
     */
    protected function getBasicMovesetCoordinates($kam_position, $board_state)
    {
        $basic_modifications = array(
            array(-2, 0),
            array(-1, 0),
            array(1, 0),
            array(2, 0),
            array(0, -2),
            array(0, -1),
            array(0, 1),
            array(0, 2),
        );

        $possible_coordinates = $this->generatePossibleCoordinatesByModification($kam_position, $basic_modifications);
        $filtered_board_state = $this->filterBoardStateForPossibleCoordinates($board_state, $possible_coordinates);
        return $this->generateMovesetPositionsFromFilteredBoardState($filtered_board_state, "basic");
    }

    /**
     * Generates coordinates for sun token moveset
     */
    protected function getSunMovesetCoordinates($board_state, $kam_position)
    {
        $sun_target_coordinates = array(
            array(0, 0),
            array(0, 4),
            array(4, 0),
            array(4, 4)
        );

        $possible_coordinates = array();
        foreach ($sun_target_coordinates as $coordinate) {
            if ($coordinate[0] !== $kam_position[0] || $coordinate[1] !== $kam_position[1]) {
                array_push($possible_coordinates, $coordinate[0] . $coordinate[1]);
            }
        }

        $filtered_board_state = $this->filterBoardStateForPossibleCoordinates($board_state, $possible_coordinates);
        return $this->generateMovesetPositionsFromFilteredBoardState($filtered_board_state, "sun");
    }

    /**
     * Generates coordinates for horse token moveset
     */
    protected function getHorseMovesetCoordinates($kam_position, $board_state)
    {
        $horse_modifications = array(
            array(-2, -1),
            array(-2, 1),
            array(2, -1),
            array(2, 1),
            array(-1, -2),
            array(-1, 2),
            array(1, -2),
            array(1, 2),
        );

        $possible_coordinates = $this->generatePossibleCoordinatesByModification($kam_position, $horse_modifications);
        $filtered_board_state = $this->filterBoardStateForPossibleCoordinates($board_state, $possible_coordinates);
        return $this->generateMovesetPositionsFromFilteredBoardState($filtered_board_state, "horse");
    }

    /**
     * Generates coordinates for tree token moveset
     */
    protected function getTreeMovesetCoordinates($kam_position, $board_state)
    {
        $tree_modifications = array(
            array(-1, -1),
            array(-1, 1),
            array(1, -1),
            array(1, 1),
        );

        $possible_coordinates = $this->generatePossibleCoordinatesByModification($kam_position, $tree_modifications);
        $filtered_board_state = $this->filterBoardStateForPossibleCoordinates($board_state, $possible_coordinates);
        return $this->generateMovesetPositionsFromFilteredBoardState($filtered_board_state, "tree");
    }

    /**
     * Generates coordinates for water token moveset
     */
    protected function getWaterMovesetCoordinates($kam_position, $board_state)
    {
        $water_modifications = array(
            array(0, 1),
            array(0, 2),
            array(0, 3),
            array(0, 4),

            array(0, -1),
            array(0, -2),
            array(0, -3),
            array(0, -4),

            array(1, 0),
            array(2, 0),
            array(3, 0),
            array(4, 0),

            array(-1, 0),
            array(-2, 0),
            array(-3, 0),
            array(-4, 0),

            array(1, 1),
            array(2, 2),
            array(3, 3),
            array(4, 4),

            array(1, -1),
            array(2, -2),
            array(3, -3),
            array(4, -4),

            array(-1, 1),
            array(-2, 2),
            array(-3, 3),
            array(-4, 4),

            array(-1, -1),
            array(-2, -2),
            array(-3, -3),
            array(-4, -4),
        );

        $possible_coordinates = $this->generatePossibleCoordinatesByModification($kam_position, $water_modifications);
        $filtered_board_state = $this->filterBoardStateForPossibleCoordinates($board_state, $possible_coordinates);
        return $this->generateMovesetPositionsFromFilteredBoardState($filtered_board_state, "water");
    }

    /**
     * Generates coordinates for owl token moveset
     */
    protected function getOwlMovesetCoordinates($board_state, $kam_position)
    {
        $filtered_board_state = $this->generateMovesetPositionsFromFilteredBoardState($board_state, "owl");
        return array_filter($filtered_board_state, function ($coordinate) use ($kam_position) {
            return $coordinate["x"] !== $kam_position[0] || $coordinate["y"] !== $kam_position[1];
        });
    }

    /**
     * Generate a reduced array based on coordinates of possible movements
     */
    protected function generateReducedResultsBasedOnCoordinates($results)
    {
        return array_reduce($results, function ($acc, $item) {
            $key = $item["x"] . $item["y"];

            if (empty($acc[$key])) {
                $acc[$key] = [
                    "x" => $item["x"],
                    "y" => $item["y"],
                    "movement" => []
                ];
            }
            $acc[$key]["movement"] = array_merge($acc[$key]["movement"], [$item["movement"]]);

            return $acc;
        }, array());
    }

    /**
     * Get opponent id
     * This method works as filtering out current_player_id from player_ids
     */
    protected function getOpponentId($current_player_id)
    {
        $player_ids = array_keys($this->loadPlayersBasicInfos());

        $opponent_ids = array_filter($player_ids, function ($player_id) use ($current_player_id) {
            return $player_id !== $current_player_id;
        });

        return reset($opponent_ids);
    }

    /**
     * Updates kam position in database
     */
    protected function updateKamPositionInDB($x, $y)
    {
        $sql = "UPDATE token SET x='$x', y='$y' WHERE type='kam'";
        $this->DbQuery($sql);
    }

    protected function getTokenAtCoordinate($x, $y)
    {
        $sql = "SELECT * FROM token WHERE x='$x' AND y='$y' AND NOT type='kam'";
        return self::getObjectFromDB($sql);
    }

    /**
     * Move token at target location to player_id
     */
    protected function updateTokenPositionToPlayerId($x, $y, $player_id)
    {
        $sql = "UPDATE token SET x=null, y=null, location='$player_id' WHERE x='$x' AND y='$y' AND NOT type='kam'";
        $this->DbQuery($sql);
    }

    /**
     * Remove first occurance of token from player_id
     */
    protected function removeSpentTokenFromPlayerId($token, $player_id)
    {
        $sql = "UPDATE token SET location='spent' WHERE location='$player_id' AND type='$token' LIMIT 1";
        $this->DbQuery($sql);
    }

    protected function getPlayerIds()
    {
        $players = $this->loadPlayersBasicInfos();
        return array_keys($players);
    }

    protected function getTokenStateOfPlayersFromDB($token)
    {
        $sql = "SELECT * FROM token WHERE type='$token' AND NOT location='board' AND NOT location='spent'";
        return self::getObjectListFromDB($sql);
    }

    protected function initializedPlayerScores()
    {
        $init_player_scores = array();
        foreach ($this->getPlayerIds() as $player_id) {
            $init_player_scores[$player_id] = 0;
        }

        return $init_player_scores;
    }

    protected function resetPlayerScoresFromDB()
    {
        foreach ($this->getPlayerIds() as $player_id) {
            $this->setPlayerScoresToDB($player_id, 0);
        }
    }


    protected function setPlayerScoresToDB($player_id, $score)
    {
        $sql = "UPDATE player SET player_score=$score WHERE player_id='$player_id'";
        $this->DbQuery($sql);
    }

    protected function getPlayerScoreFromDB($player_id)
    {
        $sql = "SELECT player_score FROM player WHERE player_id='$player_id'";
        return $this->getUniqueValueFromDB($sql);
    }

    protected function calculatePlayerScores()
    {
        list($first_player_id, $second_player_id) = $this->getPlayerIds();

        $player_scores = $this->initializedPlayerScores();

        foreach (array_values($this->token_types) as $token) {
            $token_state_of_players =  $this->getTokenStateOfPlayersFromDB($token["type"]);
            $token_counts_by_player_id = array_reduce($token_state_of_players, function ($acc, $token) {
                $acc[$token["location"]] += 1;
                return $acc;
            }, $this->initializedPlayerScores());

            $first_player_count = $token_counts_by_player_id[$first_player_id];
            $second_player_count = $token_counts_by_player_id[$second_player_id];

            if ($first_player_count === $second_player_count) {
                continue;
            }
            if ($first_player_count > $second_player_count) {
                $player_scores[$first_player_id] += $token["points"];
            }
            if ($second_player_count > $first_player_count) {
                $player_scores[$second_player_id] += $token["points"];
            }
        }

        foreach ($player_scores as $player_id => $score) {
            $this->setPlayerScoresToDB($player_id, $score);
        }


        return $player_scores;
    }

    protected function updateDBForCurrentGameRound()
    {
        $player_ids = $this->getPlayerIds();
        $active_player_id = $this->getActivePlayerId();
        $player_scores = [];
        $possible_kam_movements = $this->getPossibleKamMovements(intval($active_player_id));
        $win_condition = empty($possible_kam_movements) ? "no_movement" : "natural";
        $winning_player_id = null;
        $winning_score = 0;
        $player_1_score = 0;
        $player_2_score = 0;
        $current_game_round = $this->getCurrentGameRound();
        $current_game_round_id = $current_game_round[0]["id"];
        $player_1_id = strval($current_game_round[0]["player_1"]);
        $player_2_id = strval($current_game_round[0]["player_2"]);

        if ($win_condition === "no_movement") {
            foreach ($player_ids as $player_id) {
                $this->setPlayerScoresToDB($player_id, $player_id === $active_player_id ? 0 : 1);
            }
        }

        foreach ($player_ids as $player_id) {
            $player_score = $this->getPlayerScoreFromDB($player_id);

            $player_scores[$player_id] = $player_score;

            if (strval($player_id) === $player_1_id) {
                $player_1_score = $player_score;
            }

            if (strval($player_id) === $player_2_id) {
                $player_2_score = $player_score;
            }

            if ($player_1_score === $player_2_score) {
                $winning_player_id = "tie";
            } else {
                if (intval($player_score) > $winning_score) {
                    $winning_score = intval($player_score);
                    $winning_player_id = $player_id;
                }
            }
        }

        $update_gameround_sql = "UPDATE gameround SET 
            is_current=false, 
            winner='$winning_player_id', 
            win_condition='$win_condition',
            player_1_score=$player_1_score, 
            player_2_score=$player_2_score 
            WHERE id='$current_game_round_id'";
        $this->DbQuery($update_gameround_sql);
    }

    protected function updatePlayerScoresToRepresentGameEnd()
    {
        $players = $this->getPlayerIds();

        $game_rounds = $this->getGameRoundHistory();
        foreach ($players as $player_id) {
            $game_round_score = count(array_filter($game_rounds, function ($game_round) use ($player_id) {
                return $game_round["winner"] === strval($player_id);
            }));

            $this->setPlayerScoresToDB($player_id, $game_round_score);
        }
    }

    protected function getMovementStatName($spent_token)
    {
        return "{$spent_token}Movement";
    }

    protected function getGameRoundHistory()
    {
        $sql = "SELECT * FROM gameround";
        return self::getObjectListFromDB($sql);
    }

    protected function getCompletedGameRoundHistory()
    {
        $sql = "SELECT * FROM gameround WHERE NOT winner='null'";
        return self::getObjectListFromDB($sql);
    }

    protected function getLastRoundWinnerPlayerId()
    {
        $sql = "SELECT winner FROM gameround WHERE NOT winner='null' ORDER BY id DESC LIMIT 1";
        return self::getUniqueValueFromDB($sql);
    }

    protected function getPlayerWonRounds($player_id)
    {
        $sql = "SELECT * FROM gameround WHERE winner='$player_id'";
        return self::getObjectListFromDB($sql);
    }

    protected function getCurrentGameRound()
    {
        $sql = "SELECT * FROM gameround WHERE is_current=1";
        return self::getObjectListFromDB($sql);
    }

    protected function handleRoundEndNotifications()
    {
        $active_player_id = $this->getActivePlayerId();
        $possible_kam_movements = $this->getPossibleKamMovements(intval($active_player_id));
        $token_board_state = $this->getTokenBoardStateFromDB();

        if (empty($possible_kam_movements)) {
            $this->notifyAllPlayers(
                "roundEndWithNoPossibleMovement",
                clienttranslate('Round ended with running out of possible movements, ${winnerName} won the round!'),
                array(
                    'loserName' => $this->getActivePlayerName(),
                    'winnerName' => $this->getPlayerNameById($this->getOpponentId($active_player_id))
                )
            );

            $this->setStat(0, "howRoundEnded");
        }

        if (count($token_board_state) === 1) {
            $opponent_id = $this->getOpponentId($active_player_id);
            $active_player_score = $this->getPlayerScoreFromDB($active_player_id);
            $opponent_score = $this->getPlayerScoreFromDB($opponent_id);
            $winner = $active_player_score > $opponent_score ? "active" : "opponent";

            $this->notifyAllPlayers(
                "roundEndWithScoring",
                clienttranslate('Round ended. ${winnerName} has ${winnerScore} points while ${loserName} has ${loserScore} points. ${winnerName} won the round!'),
                $winner === "active" ?
                    array(
                        'loserId' => $opponent_id,
                        'opponentId' => $active_player_id,
                        'loserName' => $this->getPlayerNameById($opponent_id),
                        'winnerName' => $this->getActivePlayerName(),
                        'winnerScore' => $active_player_score,
                        'loserScore' => $opponent_score
                    ) : array(
                        'loserId' => $active_player_id,
                        'opponentId' => $opponent_id,
                        'loserName' => $this->getActivePlayerName(),
                        'winnerName' => $this->getPlayerNameById($opponent_id),
                        'winnerScore' => $opponent_score,
                        'loserScore' => $active_player_score
                    )
            );

            $this->setStat(1, "howRoundEnded");
        }
    }

    protected function handleGameEndNotifications()
    {
        $player_scores = array();
        $player_ids = $this->getPlayerIds();

        foreach ($player_ids as $player_id) {
            $player_score = $this->getPlayerScoreFromDB($player_id);
            $player_scores[$player_id] = $player_score;
        }

        $first_player_id = array_key_first($player_scores);
        $second_player_id = array_key_last($player_scores);

        $first_player_score = $player_scores[$first_player_id];
        $second_player_score = $player_scores[$second_player_id];

        $winner = $first_player_score > $second_player_score ? "first" : "second";

        $this->notifyAllPlayers(
            "gameEnd",
            clienttranslate('Game ended. ${winnerName} has ${winnerScore} round wins while ${loserName} has ${loserScore} round wins. ${winnerName} won the game!'),
            array(
                "winnerName" => $this->getPlayerNameById($winner === "first" ? $first_player_id : $second_player_id),
                "loserName" => $this->getPlayerNameById($winner === "first" ? $second_player_id : $first_player_id),
                "winnerScore" => $winner === "first" ? $first_player_score : $second_player_score,
                "loserScore" => $winner === "first" ? $second_player_score : $first_player_score,
            )
        );

        $this->gamestate->nextState("gameEnd");
    }

    protected function handleRoundEndStateChange()
    {
        $required_round_win = $this->gamestate->table_globals[100] === "2" ? 2 : 1;
        $player_ids = $this->getPlayerIds();

        $gamerounds = [];
        $should_game_end = false;

        foreach ($player_ids as $player_id) {
            $player_won_round_count = count($this->getPlayerWonRounds($player_id));
            if ($player_won_round_count === intval($required_round_win)) {
                $should_game_end = true;
            }
            array_push($gamerounds, [$player_id => $player_won_round_count]);
        }

        if (!$should_game_end) {
            $this->gamestate->nextState("roundEndConfirmation");
        } else {
            $this->gamestate->nextState("prepareGameEnd");
        }
    }

    /**
     * This method is called each time it is the turn of a player who has quit the game (= "zombie" player).
     * You can do whatever you want in order to make sure the turn of this player ends appropriately
     * (ex: pass).
     *
     * Important: your zombie code will be called when the player leaves the game. This action is triggered
     * from the main site and propagated to the gameserver from a server, not from a browser.
     * As a consequence, there is no current player associated to this action. In your zombieTurn function,
     * you must _never_ use `getCurrentPlayerId()` or `getCurrentPlayerName()`, otherwise it will fail with a
     * "Not logged" error message.
     *
     * @param array{ type: string, name: string } $state
     * @param int $active_player
     * @return void
     * @throws feException if the zombie mode is not supported at this game state.
     */
    protected function zombieTurn(array $state, int $active_player): void
    {
        $state_name = $state["name"];

        if ($state["type"] === "activeplayer") {
            switch ($state_name) {
                default: {
                        $this->gamestate->nextState("zombiePass");
                        break;
                    }
            }

            return;
        }

        // Make sure player is in a non-blocking status for role turn.
        if ($state["type"] === "multipleactiveplayer") {
            $this->gamestate->setPlayerNonMultiactive($active_player, '');
            return;
        }

        throw new feException("Zombie mode not supported at this game state: \"{$state_name}\".");
    }

    /**
     * Group items from an array together by some criteria or value.
     *
     * @param  $arr array The array to group items from
     * @param  $criteria string|callable The key to group by or a function the returns a key to group by.
     * @return array
     *
     */
    protected function groupBy($arr, $criteria): array
    {
        return array_reduce($arr, function ($accumulator, $item) use ($criteria) {
            $key = (is_callable($criteria)) ? $criteria($item) : $item[$criteria];
            if (!array_key_exists($key, $accumulator)) {
                $accumulator[$key] = [];
            }

            array_push($accumulator[$key], $item);
            return $accumulator;
        }, []);
    }
}
