<?php

/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * iye implementation : © Mustafa Yilmaz musyilmaz.dev@gmail.com
 *
 * This code has been produced on the BGA studio platform for use on https://boardgamearena.com.
 * See http://en.doc.boardgamearena.com/Studio for more information.
 * -----
 */

declare(strict_types=1);

/**
 * @property iye $game
 */
class action_iye extends APP_GameAction
{
    /**
     * This is the constructor. Do not try to implement a `__construct` to bypass this method.
     */
    public function __default()
    {
        if ($this->isArg("notifwindow")) {
            $this->view = "common_notifwindow";
            $this->viewArgs["table"] = $this->getArg("table", AT_posint, true);
        } else {
            $this->view = "iye_iye";
            $this->trace("Complete re-initialization of board game.");
        }
    }

    public function test() {}
}
