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
        $template = self::getGameName() . "_" . self::getGameName();
    }
}
