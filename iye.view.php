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
 * iye.view.php
 *
 * This is your "view" file.
 *
 * The method "build_page" below is called each time the game interface is displayed to a player, ie:
 * _ when the game starts
 * _ when a player refreshes the game page (F5)
 *
 * "build_page" method allows you to dynamically modify the HTML generated for the game interface. In
 * particular, you can set here the values of variables elements defined in iye_iye.tpl (elements
 * like {MY_VARIABLE_ELEMENT}), and insert HTML block elements (also defined in your HTML template file)
 *
 * Note: if the HTML of your game interface is always the same, you don't have to place anything here.
 *
 */

require_once(APP_BASE_PATH . "view/common/game.view.php");

/**
 * @property iye $game
 */
class view_iye_iye extends game_view
{
    /**
     * Returns the game name. Do not modify.
     */
    protected function getGameName()
    {
        // Used for translations and stuff. Please do not modify.
        return "iye";
    }

    /**
     * Main view function.
     */
    public function build_page($viewArgs)
    {
        $this->page->begin_block("iye_iye", "token_zone");
        $this->page->begin_block("iye_iye", "player");
        $players = $this->game->players;

        foreach ($players as $player_id => $player) {
            $this->page->insert_block('player', array(
                'PLAYER_ID' => $player_id,
                'PLAYER_NAME' => $player["player_name"],
                'PLAYER_COLOR' => $player["player_color"]
            ));
        }
    }
}
