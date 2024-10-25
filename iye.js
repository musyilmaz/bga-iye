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

const PLAYER_MOVE_KAM = "playerMoveKam";
const CLIENT_PLAYER_SELECT_TOKEN_TO_MOVE = "client_playerSelectTokenToMove";
const CLIENT_PLAYER_CONFIRM_MOVE = "client_playerConfirmMove";

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
      for (let player_id in gamedatas.players) {
        const player = gamedatas.players[player_id];
      }

      // TODO: Set up your game interface here, according to "gamedatas"

      this.setupGameBoard(gamedatas.materialInfo.board);
      this.setupTokens(gamedatas);

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
      switch (stateName) {
        case PLAYER_MOVE_KAM: {
          this.updatePossibleKamCoordinates(args.args.possibleCoordinates);
          break;
        }
        case CLIENT_PLAYER_SELECT_TOKEN_TO_MOVE: {
          console.log(
            "ENTERING STATE :: CLIENT_PLAYER_SELECT_TOKEN_TO_MOVE",
            args
          );
          break;
        }
        case CLIENT_PLAYER_CONFIRM_MOVE: {
          console.log("ENTERING STATE :: CLIENT_PLAYER_CONFIRM_MOVE", args);
          break;
        }
      }
    },

    // onLeavingState: this method is called each time we are leaving a game state.
    //                 You can use this method to perform some user interface changes at this moment.
    //
    onLeavingState: function (stateName) {
      switch (stateName) {
        case PLAYER_MOVE_KAM: {
          console.log("LEAVING STATE :: PLAYER_MOVE_KAM");
          break;
        }
        case CLIENT_PLAYER_SELECT_TOKEN_TO_MOVE: {
          console.log("LEAVING STATE :: CLIENT_PLAYER_SELECT_TOKEN_TO_MOVE");
          break;
        }
        case CLIENT_PLAYER_CONFIRM_MOVE: {
          console.log("LEAVING STATE :: CLIENT_PLAYER_CONFIRM_MOVE");
          break;
        }
      }
    },

    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    onUpdateActionButtons: function (stateName, args) {
      if (this.isCurrentPlayerActive()) {
        switch (stateName) {
          case PLAYER_MOVE_KAM: {
            console.log("UPDATE_ACTION_BUTTONS :: PLAYER_MOVE_KAM", args);
            break;
          }
          case CLIENT_PLAYER_SELECT_TOKEN_TO_MOVE: {
            console.log(
              "UPDATE_ACTION_BUTTONS :: CLIENT_PLAYER_SELECT_TOKEN_TO_MOVE",
              args
            );
            break;
          }
          case CLIENT_PLAYER_CONFIRM_MOVE: {
            console.log(
              "UPDATE_ACTION_BUTTONS :: CLIENT_PLAYER_CONFIRM_MOVE",
              args
            );
            break;
          }
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
    setupTokens: function (gamedatas) {
      const { tokenState, players, materialInfo } = gamedatas;

      tokenState["board"].map((token) => {
        this.placeTokenOnBoard(token);
      });

      for (const playerId in players) {
        const tokenAmounts = this.playerTokenAmounts(
          tokenState[playerId],
          materialInfo.tokenTypes
        );

        for (const [tokenType, tokenAmount] of tokenAmounts) {
          const [playerTokenElement, playerTokenAmountElement] =
            document.getElementById(
              `player_${playerId}_token_${tokenType}_wrapper`
            ).children;

          if (tokenAmount) {
            dojo.removeClass(playerTokenElement, "low_opacity");
            dojo.removeClass(playerTokenAmountElement, "hidden");
          } else {
            dojo.addClass(playerTokenElement, "low_opacity");
            dojo.addClass(playerTokenAmountElement, "hidden");
          }

          playerTokenAmountElement.innerText = tokenAmount;
        }
      }
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
    playerTokenAmounts: function (playerTokens, tokenTypes) {
      const tokenAmounts = new Map();

      for (const tokenType in tokenTypes) {
        tokenAmounts.set(tokenType, 0);
      }

      if (!playerTokens) return tokenAmounts;

      for (const playerToken of playerTokens) {
        tokenAmounts.set(
          playerToken.type,
          tokenAmounts.get(playerToken.type) + 1
        );
      }

      return tokenAmounts;
    },
    updatePossibleKamCoordinates: function (possibleCoordinates) {
      document.querySelectorAll(".possible_coordinate").forEach((div) => {
        // TODO: This might be a hac and not needed
        div.removeEventListener("click");
        div.classList.remove("possible_coordinate");
      });

      for (const coordinate of possibleCoordinates) {
        const { x, y } = coordinate;
        const targetSquare = document.getElementById(`square_${x}_${y}`);

        targetSquare.classList.add("possible_coordinate");
        targetSquare.classList.add(`possible_coordinate_${x}_${y}_tooltip`);
        targetSquare.addEventListener("click", (e) =>
          this.onMoveKamToCoordinate(e, coordinate)
        );

        this.addTooltipToClass(
          `possible_coordinate_${x}_${y}_tooltip`,
          _("TODO this information"),
          _("Change this information")
        );
      }
    },

    ///////////////////////////////////////////////////
    //// Player's action
    onMoveKamToCoordinate: function (event, coordinateInfo) {
      event.preventDefault();
      event.stopPropagation();

      this.resetSelectedTargetSquare();
      const { x, y, movement: spendableTokens } = coordinateInfo;
      const targetSquare = document.getElementById(`square_${x}_${y}`);

      if (!targetSquare.classList.contains("possible_coordinate")) return;

      this.selectTargetSquare(targetSquare);
      this.moveKamToTargetSquare(targetSquare);

      this.updateInformationZone(
        this.createInformationForTokenPassingToOpponent(x, y),
        true
      );

      if (spendableTokens.length === 1) {
        const token = spendableTokens[0];
        this.updateInformationZone(
          this.createInformationForTokenToSpend(token),
          false
        );
        this.setClientState(CLIENT_PLAYER_CONFIRM_MOVE, {
          descriptionmyturn: _("${you} must confirm your turn"),
          args: { x, y, token },
        });
      } else {
        this.setClientState(CLIENT_PLAYER_SELECT_TOKEN_TO_MOVE, {
          descriptionmyturn: _(
            "${you} must select a token to move selected position"
          ),
          args: {
            x,
            y,
            spendableTokens,
          },
        });
      }
    },

    resetSelectedTargetSquare: function () {
      document
        .querySelectorAll(".selected_possible_coordinate")
        .forEach((spc) => spc.classList.remove("selected_possible_coordinate"));
    },
    selectTargetSquare: function (targetSquare) {
      targetSquare.classList.add("selected_possible_coordinate");
    },
    moveKamToTargetSquare: function (targetSquare) {
      const kamToken = document.getElementsByClassName("kam")[0];
      this.slideToObject(kamToken, targetSquare).play();
    },
    createInformationForTokenPassingToOpponent: function (x, y) {
      const tokenAtTargetSquare = document
        .getElementById(`token_${x}_${y}`)
        .getAttribute("data-token-type");

      return `
        <div class="whiteblock token_transfer_information">
          <span>Your opponent will get: </span>
          <div class="information_token" data-token-type="${tokenAtTargetSquare}"></div>
        </div>
      `;
    },
    createInformationForTokenToSpend: function (token) {
      if (token === "basic") {
        return `
          <div class="whiteblock token_spend_information">
            No token is needed to complete this movement (basic movement)
          </div>
        `;
      } else {
        return `
          <div class="whiteblock token_spend_information">
            <span>You will spend </span>
            <div class="information_token" data-token-type="${token}"></div>
            <span> token to complete this movement (${token} movement)</span>
          </div>
        `;
      }
    },
    updateInformationZone: function (element, resetInformationZone) {
      const informationZone = document.getElementById("information_zone");
      if (resetInformationZone) {
        informationZone.innerHTML = "";
      }
      informationZone.insertAdjacentHTML("afterbegin", element);
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
