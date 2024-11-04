<?php

/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * iye implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * states.inc.php
 *
 * iye game states description
 *
 */

$machinestates = [
    STATE_GAME_SETUP => array(
        "name" => "gameSetup",
        "description" => "",
        "type" => "manager",
        "action" => "stGameSetup",
        "transitions" => ["" => STATE_PLAYER_MOVE_KAM]
    ),
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
        "transitions" => ["nextTurn" => STATE_PLAYER_MOVE_KAM, "prepareGameEnd" => STATE_PREPARE_GAME_END]
    ],
    STATE_PREPARE_GAME_END => [
        "name" => "pregameEnd",
        "description" => clienttranslate('Calculating game end'),
        "type" => "game",
        "action" => "stPrepareGameEnd",
        "transitions" => array("gameEnd" => STATE_GAME_END)
    ],
    STATE_GAME_END => [
        "name" => "gameEnd",
        "description" => clienttranslate("End of game"),
        "type" => "manager",
        "action" => "stGameEnd",
        "args" => "argGameEnd"
    ],
];
