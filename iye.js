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

const BOARD = {
  COLS: { size: 5 },
  ROWS: { size: 5 },
};

const TOKENS = {
  SUN: { type: "sun", amount: 9 },
  HORSE: { type: "horse", amount: 7 },
  TREE: { type: "tree", amount: 5 },
  WATER: { type: "water", amount: 3 },
  OWL: { type: "owl", amount: 1 },
};

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

      // Setting up player boards
      for (var player_id in gamedatas.players) {
        var player = gamedatas.players[player_id];

        // TODO: Setting up players boards if needed
      }

      // TODO: Set up your game interface here, according to "gamedatas"
      const gameboard = document.getElementById("iye_board");

      for (let x = 1; x <= BOARD.COLS.size; x++) {
        for (let y = 1; y <= BOARD.ROWS.size; y++) {
          gameboard.insertAdjacentHTML(
            `afterbegin`,
            this.getSquareElement(x, y),
          );
        }
      }

      this.setupTokensOnBoard(gamedatas.token_types);

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
                () => this.onCardClick(cardId),
              ),
            );

            this.addActionButton(
              "actPass-btn",
              _("Pass"),
              () => this.bgaPerformAction("actPass"),
              null,
              null,
              "gray",
            );
            break;
        }
      }
    },

    ///////////////////////////////////////////////////
    //// Utility methods
    ///////////////////////////////////////////////////
    getSquareElement: function (x, y) {
      // Horizontal and Vertical spacing values from gameboard 1071x720px version
      const horizontal = { scale: 140, offset: 191 };
      const vertical = { scale: 139, offset: 18 };

      const left = Math.round((x - 1) * horizontal.scale + horizontal.offset);
      const top = Math.round((y - 1) * vertical.scale + vertical.offset);

      return `<div id="square_${x}_${y}" class="iye_square" style="left: ${left}px; top: ${top}px;"></div>`;
    },

    setupTokensOnBoard: function (token_types) {
      const sunTokens = Array(token_types.sun.amount).fill(
        token_types.sun.type,
      );
      const horseTokens = Array(token_types["horse"].amount).fill(
        token_types["horse"].type,
      );
      const treeTokens = Array(token_types["tree"].amount).fill(
        token_types["tree"].type,
      );
      const waterTokens = Array(token_types["water"].amount).fill(
        token_types["water"].type,
      );
      const owlTokens = Array(token_types["owl"].amount).fill(
        token_types["owl"].amount,
      );

      const tokens = [
        ...sunTokens,
        ...horseTokens,
        ...treeTokens,
        ...waterTokens,
        ...owlTokens,
      ];

      const shuffledTokensWithPos = tokens
        .map((val) => ({
          val,
          sort: Math.random(),
        }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ val }, index) => {
          return {
            type: val,
            x: (index % BOARD.COLS.size) + 1,
            y: Math.floor(index / BOARD.COLS.size + 1),
          };
        })
        .map((token) => this.placeTokenOnBoard(token));
    },

    placeTokenOnBoard: function (token) {
      const { x, y, type } = token;
      const tokens = document.getElementById("iye_tokens");

      tokens.insertAdjacentHTML(
        "beforeend",
        `<div class="token" data-token-type="${type}" id="token_${x}_${y}"></div>`,
      );

      this.placeOnObject(`token_${x}_${y}`, `square_${x}_${y}`);
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
