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
        this.getPlayerPanelElement(player_id).innerHTML = this.format_block(
          "jstpl_player_board",
          {
            player_id,
            sun: { present: "full_opacity", amount: 4 },
            horse: { present: "low_opacity", amount: 0 },
            tree: { present: "full_opacity", amount: 1 },
            water: { present: "full_opacity", amount: 1 },
            owl: { present: "full_opacity", amount: 1 },
          }
        );
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
          break;
        }
        case CLIENT_PLAYER_CONFIRM_MOVE: {
          this.updateInformationZone(
            this.createInformationForTokenToSpend(args.args.token),
            false
          );
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
          break;
        }
        case CLIENT_PLAYER_SELECT_TOKEN_TO_MOVE: {
          break;
        }
        case CLIENT_PLAYER_CONFIRM_MOVE: {
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
            const { x, y, spendableTokens } = args;
            for (const token of spendableTokens) {
              this.addActionButton(
                `confirm_${token}Spend`,
                _(`Spend ${this.capitalizeWord(token)} Token`),
                () => {
                  this.setClientState(CLIENT_PLAYER_CONFIRM_MOVE, {
                    descriptionmyturn: _("${you} must confirm your turn"),
                    args: { x, y, token },
                  });
                }
              );
            }
            this.addActionButton(
              "cancel_playerMoveKam",
              _("Reset Turn"),
              () => {
                this.resetTurn();
              },
              null,
              false,
              "gray"
            );
            break;
          }
          case CLIENT_PLAYER_CONFIRM_MOVE: {
            this.addActionButton(
              "confirm_playerMoveKam",
              _("Confirm Turn"),
              () => {
                this.bgaPerformAction("actPlayerMoveKam", {
                  x: args.x,
                  y: args.y,
                  spent_token: args.token,
                });
              }
            );
            this.addActionButton(
              "cancel_playerMoveKam",
              _("Reset Turn"),
              () => {
                this.resetTurn();
              },
              null,
              false,
              "gray"
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
      if (!this.isCurrentPlayerActive()) return;

      document.querySelectorAll(".possible_coordinate").forEach((div) => {
        div.removeEventListener("click", null);
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
        this.setClientState(CLIENT_PLAYER_CONFIRM_MOVE, {
          descriptionmyturn: _("${you} must confirm your turn"),
          args: { x, y, token },
        });
      } else {
        this.setClientState(CLIENT_PLAYER_SELECT_TOKEN_TO_MOVE, {
          descriptionmyturn: _("${you} must select a token to spend"),
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
    getKamTokenState: function () {
      const { tokenState } = this.gamedatas;
      const kamToken = tokenState["board"].find(
        (token) => token.type === "kam"
      );

      return kamToken;
    },
    moveKamToCoordinate: function (x, y) {
      const targetSquare = document.getElementById(`square_${x}_${y}`);
      const kamToken = document.getElementsByClassName("kam")[0];
      this.slideToObject(kamToken, targetSquare).play();
    },
    moveKamToTargetSquare: function (targetSquare) {
      const kamToken = document.getElementsByClassName("kam")[0];
      this.slideToObject(kamToken, targetSquare).play();
    },
    moveAndDestroyTokenToPlayerInformationArea: function (x, y, playerId) {
      const targetToken = document.getElementById(`token_${x}_${y}`);
      const playerInformationArea = document.getElementById(
        `player_${playerId}`
      );
      this.slideToObjectAndDestroy(targetToken, playerInformationArea, 500, 0);
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
            <span class="title">Basic Movement</span>
            No token is needed to complete this movement.
          </div>
        `;
      } else {
        return `
          <div class="whiteblock token_spend_information">
            <div class="information_title">
              <span class="title">
                ${this.capitalizeWord(token)} Movement
              </span>
              <div class="information_token" data-token-type="${token}"></div>
            </div>
            <span>You will spend ${token} token to complete this movement.</span>
          </div>
        `;
      }
    },
    updateInformationZone: function (element, resetInformationZone) {
      const informationZone = document.getElementById("information_zone");
      if (resetInformationZone) {
        informationZone.innerHTML = "";
      }
      if (element) {
        informationZone.insertAdjacentHTML("afterbegin", element);
      }
    },
    resetTurn: function () {
      const kamToken = this.getKamTokenState();

      if (kamToken) this.moveKamToCoordinate(kamToken.x, kamToken.y);
      this.updateInformationZone(null, true);
      this.resetSelectedTargetSquare();
      this.restoreServerGameState();
    },
    capitalizeWord: function (word) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    },

    setupNotifications: function () {
      const notifications = [["playerTurn", 1000]];

      notifications.forEach((notification) => {
        const [name, timeout] = notification;
        dojo.subscribe(name, this, `notif_${name}`);
        this.notifqueue.setSynchronous(name, timeout);
      });
    },
    notif_playerTurn: function (notification) {
      const { x, y, tokenState, tokenTypes, players, opponentId } =
        notification.args;

      // Remove possible moves from previous state
      if (this.isCurrentPlayerActive) {
        document.querySelectorAll(".possible_coordinate").forEach((div) => {
          div.removeEventListener("click", null);
          div.classList.remove("possible_coordinate");
        });
        document
          .querySelectorAll(".selected_possible_coordinate")
          .forEach((div) => {
            div.classList.remove("selected_possible_coordinate");
          });
      }

      // Move kam to target position
      this.moveKamToCoordinate(x, y);
      this.moveAndDestroyTokenToPlayerInformationArea(x, y, opponentId);

      this.updateInformationZone(null, true);

      // Reorganize player information area to represent current game state
      const playerTokenState = Object.groupBy(
        tokenState.filter(
          (token) => token.location !== "spent" && token.location !== "board"
        ),
        ({ location }) => location
      );

      for (const playerId in players) {
        const tokenAmounts = this.playerTokenAmounts(
          playerTokenState[playerId],
          tokenTypes
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
  });
});
