/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * iye implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * iye.js
 *
 * iye user interface script
 *
 * In this file, you are describing the logic of your user interface, in Javascript language.
 *
 */

define([
  "dojo",
  "dojo/_base/declare",
  "ebg/core/gamegui",
  "ebg/counter",
], function (dojo, declare) {
  return declare("bgagame.iye", ebg.core.gamegui, {
    constructor: function () {
      console.log("iye constructor");

      // Here, you can init the global variables of your user interface
      // Example:
      // this.myGlobalValue = 0;
    },

    /*
            setup:
            
            This method must set up the game user interface according to current game situation specified
            in parameters.
            
            The method is called each time the game interface is displayed to a player, ie:
            _ when the game starts
            _ when a player refreshes the game page (F5)
            
            "gamedatas" argument contains all datas retrieved by your "getAllDatas" PHP method.
        */

    setup: function (gamedatas) {
      console.log("Starting game setup");
      console.log("❗ gamedatas:", gamedatas);

      // Setting up player boards
      for (let player_id in gamedatas.players) {
        const player = gamedatas.players[player_id];
      }

      // TODO: Set up your game interface here, according to "gamedatas"

      this.setupGameBoard(gamedatas.material_info.board);
      this.setupTokensOnBoard(gamedatas);

      // Setup game notifications to handle (see "setupNotifications" method below)
      this.setupNotifications();

      console.log("Ending game setup");
    },

    ///////////////////////////////////////////////////
    //// Game & client states

    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    onEnteringState: function (stateName, args) {
      console.log("Entering state: " + stateName, args);

      switch (stateName) {
        /* Example:
            
            case 'myGameState':
            
                // Show some HTML block at this game state
                dojo.style( 'my_html_block_id', 'display', 'block' );
                
                break;
           */

        case "dummmy":
          break;
      }
    },

    // onLeavingState: this method is called each time we are leaving a game state.
    //                 You can use this method to perform some user interface changes at this moment.
    //
    onLeavingState: function (stateName) {
      console.log("Leaving state: " + stateName);

      switch (stateName) {
        /* Example:
            
            case 'myGameState':
            
                // Hide the HTML block we are displaying only during this game state
                dojo.style( 'my_html_block_id', 'display', 'none' );
                
                break;
           */

        case "dummmy":
          break;
      }
    },

    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    onUpdateActionButtons: function (stateName, args) {
      console.log("onUpdateActionButtons: " + stateName, args);

      if (this.isCurrentPlayerActive()) {
        switch (stateName) {
          case "playerTurn":
            const playableCardsIds = args.playableCardsIds; // returned by the argPlayerTurn

            // Add test action buttons in the action status bar, simulating a card click:
            playableCardsIds.forEach((cardId) =>
              this.addActionButton(
                `actPlayCard${cardId}-btn`,
                _("Play card with id ${card_id}").replace("${card_id}", cardId),
                () => this.onCardClick(cardId)
              )
            );

            this.addActionButton(
              "actPass-btn",
              _("Pass"),
              () => this.bgaPerformAction("actPass"),
              null,
              null,
              "gray"
            );
            break;
        }
      }
    },

    ///////////////////////////////////////////////////
    //// Utility methods
    ///////////////////////////////////////////////////
    getSquareElement: function (x, y, left, top) {
      return `<div id="square_${x}_${y}" class="iye_square" style="left: ${left}px; top: ${top}px;"></div>`;
    },
    setupGameBoard: function (board) {
      const gameboard = document.getElementById("iye_board");
      const { row, column, horizontal, vertical } = board;

      for (let x = 0; x <= column.size - 1; x++) {
        for (let y = 0; y <= row.size - 1; y++) {
          const left = Math.round(x * horizontal.scale + horizontal.offset);
          const top = Math.round(y * vertical.scale + vertical.offset);

          gameboard.insertAdjacentHTML(
            `afterbegin`,
            this.getSquareElement(x, y, left, top)
          );
        }
      }
    },
    setupTokensOnBoard: function (gamedatas) {
      const { token_state } = gamedatas;

      token_state["board"].map((token) => {
        this.placeTokenOnBoard(token);
      });
    },
    placeTokenOnBoard: function (token) {
      const { x, y, type } = token;
      const tokens = document.getElementById("iye_tokens");

      if (type === "kam") {
        tokens.insertAdjacentHTML(
          "beforeend",
          `<div class="kam" id="kam_${x}_${y}"></div>`
        );

        this.placeOnObject(`kam_${x}_${y}`, `square_${x}_${y}`);
      } else {
        tokens.insertAdjacentHTML(
          "beforeend",
          `<div class="token" data-token-type="${type}" id="token_${x}_${y}"></div>`
        );

        this.placeOnObject(`token_${x}_${y}`, `square_${x}_${y}`);
      }
    },

    ///////////////////////////////////////////////////
    //// Player's action

    /*
        
            Here, you are defining methods to handle player's action (ex: results of mouse click on 
            game objects).
            
            Most of the time, these methods:
            _ check the action is possible at this game state.
            _ make a call to the game server
        
        */

    // Example:

    onCardClick: function (card_id) {
      console.log("onCardClick", card_id);

      this.bgaPerformAction("actPlayCard", {
        card_id,
      }).then(() => {
        // What to do after the server call if it succeeded
        // (most of the time, nothing, as the game will react to notifs / change of state instead)
      });
    },

    ///////////////////////////////////////////////////
    //// Reaction to cometD notifications

    /*
            setupNotifications:
            
            In this method, you associate each of your game notifications with your local method to handle it.
            
            Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                  your iye.game.php file.
        
        */
    setupNotifications: function () {
      console.log("notifications subscriptions setup");

      // TODO: here, associate your game notifications with local methods

      // Example 1: standard notification handling
      // dojo.subscribe( 'cardPlayed', this, "notif_cardPlayed" );

      // Example 2: standard notification handling + tell the user interface to wait
      //            during 3 seconds after calling the method in order to let the players
      //            see what is happening in the game.
      // dojo.subscribe( 'cardPlayed', this, "notif_cardPlayed" );
      // this.notifqueue.setSynchronous( 'cardPlayed', 3000 );
      //
    },

    // TODO: from this point and below, you can write your game notifications handling methods

    /*
        Example:
        
        notif_cardPlayed: function( notif )
        {
            console.log( 'notif_cardPlayed' );
            console.log( notif );
            
            // Note: notif.args contains the arguments specified during you "notifyAllPlayers" / "notifyPlayer" PHP call
            
            // TODO: play the card in the user interface.
        },    
        
        */
  });
});
