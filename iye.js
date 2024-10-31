/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * iye implementation : © Mustafa Yilmaz - musyilmaz.dev@gmail.com
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
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
    },
    setup: function (gamedatas) {
      const {
        players,
        playerTokenState,
        materialInfo: { tokenTypes },
      } = gamedatas;

      this.setupPlayerBoards(players, playerTokenState, tokenTypes);
      this.setupGameBoard(gamedatas.materialInfo.board);
      this.setupTokens(gamedatas);

      this.setupNotifications();
    },
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
    //// Utility Functions
    ///////////////////////////////////////////////////
    setupPlayerBoards: function (players, playerTokenState, tokenTypes) {
      for (playerId in players) {
        const playerTokens = {};

        Object.values(tokenTypes).map((token) => {
          const tokens = playerTokenState.filter(
            (pts) => pts.player === playerId && pts.type === token.type
          );

          playerTokens[token.type] = {
            present: tokens.length > 0 ? "full_opacity" : "low_opacity",
            amount: tokens.length,
          };
        });

        this.getPlayerPanelElement(playerId).innerHTML = this.format_block(
          "jstpl_player_board",
          {
            playerId,
            ...playerTokens,
          }
        );
      }
    },
    squareElement: function (x, y, left, top) {
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
            this.squareElement(x, y, left, top)
          );
        }
      }
    },
    setupTokens: function (gamedatas) {
      const { tokenState, players, materialInfo } = gamedatas;

      tokenState["board"].map((token) => {
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
      return tokenState["board"].find((token) => token.type === "kam");
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
    fadeOutAndDestroyToken: function (x, y) {
      const targetToken = document.getElementById(`token_${x}_${y}`);
      this.fadeOutAndDestroy(targetToken, 500, 0);
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
      const { x, y, playerTokenState, tokenTypes, players, opponentId } =
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

      this.moveKamToCoordinate(x, y);
      this.fadeOutAndDestroyToken(x, y);

      this.updateInformationZone(null, true);

      this.setupPlayerBoards(players, playerTokenState, tokenTypes);
    },
  });
});
