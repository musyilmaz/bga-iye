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
 * material.inc.php
 *
 * iye game material description
 *
 * Here, you can describe the material of your game with PHP variables.
 *
 * This file is loaded in your game logic class constructor, ie these variables
 * are available everywhere in your game logic code.
 *
 */
$this->game_length = 24;

$this->board = [
  "row" => [
    "size" => 5
  ],
  "column" => [
    "size" => 5
  ],
  "horizontal" => [
    "scale" => 140,
    "offset" => 17,
  ],
  "vertical" => [
    "scale" => 139,
    "offset" => 18
  ]
];

$this->token_types = [
  "sun" => [
    "type" => "sun",
    "name" => clientTranslate("sun"),
    "tooltip" => clientTranslate("TOOLTIP: sun information"),
    "amount" => 9,
    "points" => 9
  ],
  "horse" => [
    "type" => "horse",
    "name" => clientTranslate("horse"),
    "tooltip" => clientTranslate("TOOLTIP: horse information"),
    "amount" => 7,
    "points" => 7
  ],
  "tree" => [
    "type" => "tree",
    "name" => clientTranslate("tree"),
    "tooltip" => clientTranslate("TOOLTIP: tree information"),
    "amount" => 5,
    "points" => 5
  ],
  "water" => [
    "type" => "water",
    "name" => clientTranslate("water"),
    "tooltip" => clientTranslate("TOOLTIP: water information"),
    "amount" => 3,
    "points" => 3
  ],
  "owl" => [
    "type" => "owl",
    "name" => clientTranslate("owl"),
    "tooltip" => clientTranslate("TOOLTIP: owl information"),
    "amount" => 1,
    "points" => 1
  ],
];

$this->kam = [
  "type" => "kam",
  "name" => clientTranslate("kam"),
  "tooltip" => clientTranslate("TOOLTIP: kam information"),
  "start_x" => 2,
  "start_y" => 2,
];
