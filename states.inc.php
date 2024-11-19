<?php

/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * iye implementation : © Mustafa Yilmaz musyilmaz.dev@gmail.com
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 */

use function PHPSTORM_META\type;

$machinestates = [
    STATE_GAME_SETUP => array(
        "name" => "gameSetup",
        "description" => "",
        "type" => "manager",
        "action" => "stGameSetup",
        "transitions" => ["" => STATE_PREPARE_NEW_ROUND]
    ),
    STATE_PREPARE_NEW_ROUND => [
        "name" => "prepareNewRound",
        "description" => clienttranslate("Preparing iye for a new round"),
        "type" => "manager",
        "action" => "stPrepareNewRound",
        "transitions" => ["movePlayerTurns" => STATE_PLAYER_MOVE_KAM]
    ],
    STATE_PLAYER_MOVE_KAM => [
        "name" => "playerMoveKam",
        "description" => clienttranslate('${actplayer} must move kam to a valid position'),
        "descriptionmyturn" => clienttranslate('${you} must move kam to a valid position'),
        "type" => "activeplayer",
        "args" => "argPlayerMoveKam",
        "possibleactions" => [
            "actPlayerMoveKam",
        ],
        "transitions" => ["nextPlayer" => STATE_NEXT_PLAYER]
    ],
    STATE_NEXT_PLAYER => [
        "name" => "nextPlayer",
        "type" => "game",
        "action" => "stNextPlayer",
        "updateGameProgression" => true,
        "transitions" => ["nextTurn" => STATE_PLAYER_MOVE_KAM, "prepareRoundEnd" => STATE_PREPARE_ROUND_END]
    ],
    STATE_PREPARE_ROUND_END => [
        "name" => "pregameRoundEnd",
        "description" => clienttranslate('Calculating round end'),
        "type" => "manager",
        "action" => "stPrepareRoundEnd",
        "transitions" => ["newRound" => STATE_PREPARE_NEW_ROUND, "prepareGameEnd" => STATE_PREPARE_GAME_END]
    ],
    STATE_PREPARE_GAME_END => [
        "name" => "prepareGameEnd",
        "description" => clienttranslate("Preparing for game end"),
        "type" => "manager",
        "action" => "stPrepareGameEnd",
        "transitions" => ["gameEnd" => STATE_GAME_END]
    ],
    STATE_GAME_END => [
        "name" => "gameEnd",
        "description" => clienttranslate("End of game"),
        "type" => "manager",
        "action" => "stGameEnd",
        "args" => "argGameEnd"
    ],
];
