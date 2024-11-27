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
        "transitions" => [
            "makeLastLoserActivePlayer" => STATE_MAKE_LAST_LOSER_ACTIVE_PLAYER,
            "movePlayerTurns" => STATE_PLAYER_MOVE_KAM
        ]
    ],
    STATE_MAKE_LAST_LOSER_ACTIVE_PLAYER => [
        "name" => "makeLastLoserActivePlayer",
        "type" => "game",
        "action" => "stMakeLastLoserActivePlayer",
        "updateGameProgression" => false,
        "transitions" => [
            "determineActivePlayer" => STATE_DETERMINE_ACTIVE_PLAYER
        ]
    ],
    STATE_DETERMINE_ACTIVE_PLAYER => [
        "name" => "determineActivePlayer",
        "description" => clienttranslate('${actplayer} must select who to start round'),
        "descriptionmyturn" => clienttranslate('${you} must select who to start round'),
        "type" => "activeplayer",
        "args" => "argDetermineActivePlayer",
        "possibleactions" => ["actDetermineActivePlayer"],
        "transitions" => [
            "movePlayerTurns" => STATE_PLAYER_MOVE_KAM,
            "nextPlayer" => STATE_NEXT_PLAYER
        ]
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
        "transitions" => ["roundEndConfirmation" => STATE_ROUND_END_CONFIRMATION, "prepareGameEnd" => STATE_PREPARE_GAME_END]
    ],
    STATE_ROUND_END_CONFIRMATION => [
        "name" => "roundEndConfirmation",
        "type" => "multipleactiveplayer",
        "description" => clienttranslate('Other players must confirm round end'),
        "descriptionmyturn" => clienttranslate('${you} must confirm round end'),
        "args" => "argRoundEndConfirmation",
        "possibleactions" => ["actRoundEndConfirmation"],
        "action" => "stMultiPlayerInit",
        "transitions" => ["newRound" => STATE_PREPARE_NEW_ROUND]
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
