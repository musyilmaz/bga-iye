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
define("STATE_PLAYER_MOVE_KAM", 10);
define("STATE_NEXT_PLAYER", 20);
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

        $this->initGameStateLabels([
            "my_first_global_variable" => 10,
            "my_second_global_variable" => 11,
            "my_first_game_variant" => 100,
            "my_second_game_variant" => 101,
        ]);
    }

    protected function getGameName()
    {
        return "iye";
    }

    public function getGameProgression()
    {
        $board_state = $this->getBoardStateFromDB();
        return ($this->game_length - count($board_state)) * 100 / count($board_state);
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

        // Dummy content.
        $this->setGameStateInitialValue("my_first_global_variable", 0);

        // Init game statistics.
        //
        // NOTE: statistics used in this file must be defined in your `stats.inc.php` file.

        // Dummy content.
        // $this->initStat("table", "table_teststat1", 0);
        // $this->initStat("player", "player_teststat1", 0);
        $sql_values = $this->setupInitialTokens();

        $sql = "INSERT INTO token (type, location, x, y) VALUES ";
        $sql .= implode(",", $sql_values);
        $this->DbQuery($sql);

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

        return $result;
    }

    /**
     * Game State :: STATE_PLAYER_MOVE_KAM
     *
     * Returns possible coordinates for active player to client side
     */
    public function argPlayerMoveKam(): array
    {
        return [
            "possibleCoordinates" => $this->getPossibleKamMovements(intval($this->getActivePlayerId()))
        ];
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

        // TODO GAME END Condition
        $possibleKamMovements = $this->getPossibleKamMovements(intval($this->getActivePlayerId()));
        if (empty($possibleKamMovements)) {
            var_dump("GAME IS FINISHED");
        }

        // Go to another gamestate
        // Here, we would detect if the game is over, and in this case use "endGame" transition instead 
        $this->gamestate->nextState("nextTurn");
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

        $this->notifyAllPlayers(
            "playerTurn",
            $spent_token === "basic" ?
                clienttranslate('${playerName} moves kam to (${x}, ${y}) coordinates with basic movement. ${opponentName} receives ${targetToken.type}.') :
                clienttranslate('${playerName} moves kam to (${x}, ${y}) coordinates with ${spentToken} movement. ${opponentName} receives ${targetToken.type}.'),
            array(
                'playerId' => $player_id,
                'playerName' => $this->getActivePlayerName(),
                'opponentId' => $opponent_id,
                'opponentName' => $this->getPlayerNameById($opponent_id),
                'x' => $x,
                'y' => $y,
                'spentToken' => $spent_token,
                'targetToken' => $target_token,
                'tokenState' => $tokenState,
                'tokenTypes' => $this->token_types,
                'players' => $this->loadPlayersBasicInfos(),
                'playerTokenState' => $this->getPlayerTokenStateFromDB()
            )
        );

        $this->gamestate->nextState("nextPlayer");
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
        //            // ! important ! Use DBPREFIX_<table_name> for all tables
        //
        //            $sql = "CREATE TABLE DBPREFIX_xxxxxxx ....";
        //            $this->applyDbUpgradeToAllDB( $sql );
        //       }
    }

    /********************
     * UTILITY FUNCTIONS
     */

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
