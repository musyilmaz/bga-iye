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
const BGA_HELP_FOLDED_HELP = "BgaHelp_IyeFoldedHelp";

define([
  "dojo",
  "dojo/_base/declare",
  "ebg/core/gamegui",
  "ebg/counter",
  g_gamethemeurl + "modules/bga-help.js",
], function (dojo, declare) {
  return declare("bgagame.iye", ebg.core.gamegui, {
    constructor: function () {
      console.log("iye constructor");

      this.helpManager = new HelpManager(this.game, {
        buttons: [
          new BgaHelpPopinButton({
            title: _("Card help"),
            html: `
                <h1>Main section</h1>
                <div>The HTML content of the popin</div>
            `,
          }),
          new BgaHelpExpandableButton({
            unfoldedHtml: `The expanded content of the button`,
            foldedContentExtraClasses: "color-help-folded-content",
            unfoldedContentExtraClasses: "color-help-unfolded-content",
            expandedWidth: "200px",
            expandedHeight: "400px",
            defaultFolded: false,
            localStorageFoldedKey: BGA_HELP_FOLDED_HELP,
          }),
        ],
      });
    },
    setup: function (gamedatas) {
      const {
        players,
        playerTokenState,
        tokenState,
        materialInfo: { tokenTypes },
      } = gamedatas;

      this.setupPlayerBoards(players, playerTokenState, tokenTypes);
      this.setupGameInformationPanel(
        tokenState.board.filter((t) => t.type !== "kam"),
        tokenTypes
      );
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
            break;
          }
          case CLIENT_PLAYER_SELECT_TOKEN_TO_MOVE: {
            this.actionButtonsClientPlayerSelectTokenToMove(args);
            break;
          }
          case CLIENT_PLAYER_CONFIRM_MOVE: {
            this.actionButtonsClientPlayerConfirmMove(args);
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
            present: tokens.length > 0,
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
    setupGameInformationPanel: function (boardState, tokenTypes) {
      const tokens = {};
      Object.values(tokenTypes).map((token) => {
        const tokensForType = boardState.filter((bs) => bs.type === token.type);

        tokens[token.type] = {
          present: tokensForType.length > 0,
          amount: tokensForType.length,
        };
      });

      const gameInformationPanelElement = document.getElementById(
        "player_panel_game_information"
      );

      gameInformationPanelElement.innerHTML = this.format_block(
        "jstpl_game_information",
        { total: boardState.length, ...tokens }
      );
    },
    updatePlayerScores: function (playerScores) {
      Object.keys(playerScores).map((playerId) => {
        this.scoreCtrl[playerId].toValue(playerScores[playerId]);
      });
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
        const { x, y, movement } = coordinate;
        const targetSquare = document.getElementById(`square_${x}_${y}`);

        targetSquare.classList.add("possible_coordinate");
        if (!movement.includes("basic")) {
          targetSquare.classList.add("non_basic_possible_coordinate");
        }
        targetSquare.addEventListener("click", (e) =>
          this.onMoveKamToCoordinate(e, coordinate)
        );
      }
    },
    onMoveKamToCoordinate: function (event, coordinateInfo) {
      event.preventDefault();
      event.stopPropagation();

      this.resetSelectedTargetSquare();
      const { kamCoordinate: originalKamCoordinate } =
        this.gamedatas.gamestate.args;
      const { x, y, movement: spendableTokens } = coordinateInfo;
      const targetSquare = document.getElementById(`square_${x}_${y}`);

      if (!targetSquare.classList.contains("possible_coordinate")) return;

      this.selectTargetSquare(targetSquare);
      this.moveKamToTargetSquare(targetSquare);

      if (spendableTokens.includes("basic")) {
        this.setClientState(
          CLIENT_PLAYER_CONFIRM_MOVE,
          this.argsClientPlayerConfirmMove(x, y, "basic", originalKamCoordinate)
        );
      } else if (spendableTokens.length === 1) {
        this.setClientState(
          CLIENT_PLAYER_CONFIRM_MOVE,
          this.argsClientPlayerConfirmMove(
            x,
            y,
            spendableTokens[0],
            originalKamCoordinate
          )
        );
      } else {
        this.setClientState(CLIENT_PLAYER_SELECT_TOKEN_TO_MOVE, {
          descriptionmyturn: _("${you} must select a token to spend"),
          args: { x, y, spendableTokens, kamCoordinate: originalKamCoordinate },
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
    resetTurn: function () {
      const { kamCoordinate } = this.gamedatas.gamestate.args;

      if (kamCoordinate.length)
        this.moveKamToCoordinate(kamCoordinate[0], kamCoordinate[1]);
      this.resetSelectedTargetSquare();
      this.restoreServerGameState();
    },
    capitalizeWord: function (word) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    },
    actionTokenElement: function (token) {
      return `<div class="action-token" data-token-type="${token}"></div>`;
    },
    argsClientPlayerConfirmMove: function (x, y, token, originalKamCoordinate) {
      const targetToken = document.getElementById(`token_${x}_${y}`).dataset
        .tokenType;

      if (token === "basic") {
        return {
          descriptionmyturn: _("Your opponent will get ${targetToken} token."),
          args: {
            x,
            y,
            token,
            targetToken: this.actionTokenElement(targetToken),
            kamCoordinate: originalKamCoordinate,
          },
        };
      }

      return {
        descriptionmyturn: _(
          "${you} will spend ${spentToken} - Your opponent will get ${targetToken} token."
        ),
        args: {
          x,
          y,
          token,
          spentToken: this.actionTokenElement(token),
          targetToken: this.actionTokenElement(targetToken),
          kamCoordinate: originalKamCoordinate,
        },
      };
    },
    actionButtonsClientPlayerSelectTokenToMove: function (args) {
      const { x, y, spendableTokens, kamCoordinate } = args;

      for (const token of spendableTokens) {
        this.addActionButton(
          `confirm_spend_${token}`,
          `${this.actionTokenElement(token)}`,
          () =>
            this.setClientState(
              CLIENT_PLAYER_CONFIRM_MOVE,
              this.argsClientPlayerConfirmMove(x, y, token, kamCoordinate)
            )
        );
      }

      this.addActionButton(
        "cancel_player_move_kam",
        _("Reset Turn"),
        this.resetTurn,
        null,
        false,
        "gray"
      );
    },
    actionButtonsClientPlayerConfirmMove: function (args) {
      this.addActionButton("confirm_player_turn", _("Confirm Turn"), () =>
        this.bgaPerformAction("actPlayerMoveKam", {
          x: args.x,
          y: args.y,
          spent_token: args.token,
        })
      );
      this.addActionButton(
        "cancel_player_move_kam",
        _("Reset Turn"),
        this.resetTurn,
        null,
        false,
        "gray"
      );
    },
    setupNotifications: function () {
      const notifications = [
        ["playerTurn", 1000],
        ["gameEndWithNoPossibleMovement", 1000],
        ["gameEndWithScoring", 1000],
      ];

      notifications.forEach((notification) => {
        const [name, timeout] = notification;
        dojo.subscribe(name, this, `notif_${name}`);
        this.notifqueue.setSynchronous(name, timeout);
      });
    },
    notif_playerTurn: function (notification) {
      const {
        x,
        y,
        playerTokenState,
        tokenState,
        tokenTypes,
        players,
        playerScores,
      } = notification.args;

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
        document
          .querySelectorAll(".non_basic_possible_coordinate")
          .forEach((div) => {
            div.classList.remove("non_basic_possible_coordinate");
          });
      }

      this.moveKamToCoordinate(x, y);
      this.fadeOutAndDestroyToken(x, y);

      this.setupPlayerBoards(players, playerTokenState, tokenTypes);
      this.setupGameInformationPanel(
        tokenState.board.filter((t) => t.type !== "kam"),
        tokenTypes
      );
      this.updatePlayerScores(playerScores);
    },
    notif_gameEndWithNoPossibleMovement: function (notification) {
      console.log("Game end with no possible movement", notification);
    },
    notif_gameEndWithScoring: function (notification) {
      console.log("Game end with scoring", notification);
    },

    /* @Override */
    updatePlayerOrdering() {
      this.inherited(arguments);
      dojo.place("player_panel_game_information", "player_boards", "after");
    },
  });
});
