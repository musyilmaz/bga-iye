/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * iye implementation : © Mustafa Yilmaz - musyilmaz.dev@gmail.com
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 */

const PREPARE_NEW_ROUND = "prepareNewRound";
const DETERMINE_ACTIVE_PLAYER = "determineActivePlayer";
const PLAYER_MOVE_KAM = "playerMoveKam";
const CLIENT_PLAYER_SELECT_TOKEN_TO_MOVE = "client_playerSelectTokenToMove";
const CLIENT_PLAYER_CONFIRM_MOVE = "client_playerConfirmMove";
const ROUND_END_CONFIRMATION = "roundEndConfirmation";
const PREPARE_GAME_END = "prepareGameEnd";
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
    },
    setup: function (gamedatas) {
      const {
        players,
        playerTokenState,
        tokenState,
        materialInfo: { tokenTypes },
        playerRoundScores,
      } = gamedatas;

      this.helpManager = new HelpManager(this.game, {
        buttons: [
          new BgaHelpPopinButton({
            title: _("Help"),
            buttonBackground: "red",
            html: this.iyeHelpContent(),
          }),
        ],
      });

      this.setupPlayerBoards(
        players,
        playerTokenState,
        playerRoundScores,
        tokenTypes
      );
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
        case PREPARE_NEW_ROUND: {
          break;
        }
        case DETERMINE_ACTIVE_PLAYER: {
          break;
        }
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
        case ROUND_END_CONFIRMATION: {
          break;
        }
      }
    },
    onLeavingState: function (stateName) {
      switch (stateName) {
        case PREPARE_NEW_ROUND: {
          break;
        }
        case PLAYER_MOVE_KAM: {
          break;
        }
        case CLIENT_PLAYER_SELECT_TOKEN_TO_MOVE: {
          break;
        }
        case CLIENT_PLAYER_CONFIRM_MOVE: {
          break;
        }
        case ROUND_END_CONFIRMATION: {
          break;
        }
      }
    },
    onUpdateActionButtons: function (stateName, args) {
      if (this.isCurrentPlayerActive()) {
        switch (stateName) {
          case PREPARE_NEW_ROUND: {
            break;
          }
          case DETERMINE_ACTIVE_PLAYER: {
            this.actionButtonsDetermineActivePlayer(args);
            break;
          }
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
          case ROUND_END_CONFIRMATION: {
            this.actionButttonsRoundEndConfirmation(args);
            break;
          }
        }
      }
    },
    ///////////////////////////////////////////////////
    //// Utility Functions
    ///////////////////////////////////////////////////
    setupPlayerBoards: function (
      players,
      playerTokenState,
      playerRoundScores,
      tokenTypes
    ) {
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

        const roundScore = playerRoundScores.filter(
          (prs) => prs.winner === playerId
        ).length;

        this.getPlayerPanelElement(playerId).innerHTML = this.format_block(
          "jstpl_player_board",
          {
            playerId,
            ...playerTokens,
            roundScore,
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
          totalAmount: token.amount,
          points: token.points,
        };
      });

      const gameInformationPanelElement = document.getElementById(
        "player_panel_game_information"
      );

      gameInformationPanelElement.innerHTML = this.format_block(
        "jstpl_game_information",
        {
          title: _("IYE informations"),
          description: dojo.string.substitute(
            _("${remaining} iye is present on board"),
            {
              remaining: boardState.length,
            }
          ),
          ...tokens,
        }
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
    clearTokens: function () {
      const tokens = document.getElementById("iye_tokens");
      tokens.innerHTML = null;
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
    actionButttonsRoundEndConfirmation: function (args) {
      this.addActionButton("confirm_round_end", _("Confirm Round End"), () =>
        this.bgaPerformAction("actRoundEndConfirmation", {})
      );
    },
    actionButtonsDetermineActivePlayer: function (args) {
      const { playerInformations } = args;

      for (const player of Object.values(playerInformations)) {
        this.addActionButton(
          `select_player_${player.player_id}`,
          _(`${player.player_name}`),
          () =>
            this.bgaPerformAction("actDetermineActivePlayer", {
              player_id: player.player_id,
            })
        );
      }
    },
    setupNotifications: function () {
      const notifications = [
        ["newRound", 1000],
        ["playerTurn", 1000],
        ["roundEndWithNoPossibleMovement", 1000],
        ["roundEndWithScoring", 1000],
        ["gameEnd", 1000],
      ];

      notifications.forEach((notification) => {
        const [name, timeout] = notification;
        dojo.subscribe(name, this, `notif_${name}`);
        this.notifqueue.setSynchronous(name, timeout);
      });
    },
    notif_newRound: function (notification) {
      const {
        playerScores,
        players,
        playerTokenState,
        tokenTypes,
        tokenState,
        playerRoundScores,
      } = notification.args;

      this.updatePlayerScores(playerScores);
      this.setupPlayerBoards(
        players,
        playerTokenState,
        playerRoundScores,
        tokenTypes
      );
      this.setupGameInformationPanel(
        tokenState.board.filter((t) => t.type !== "kam"),
        tokenTypes
      );
      this.clearTokens();
      this.setupTokens({ tokenState });
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
        playerRoundScores,
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

      this.setupPlayerBoards(
        players,
        playerTokenState,
        playerRoundScores,
        tokenTypes
      );
      this.setupGameInformationPanel(
        tokenState.board.filter((t) => t.type !== "kam"),
        tokenTypes
      );
      this.updatePlayerScores(playerScores);
    },
    notif_roundEndWithNoPossibleMovement: function (notification) {
      console.log("round end with no possible movement", notification);
    },
    notif_roundEndWithScoring: function (notification) {
      console.log("round end with scoring", notification);
    },
    notif_gameEnd: function (notification) {
      this.clearTokens();
    },

    /* @Override */
    updatePlayerOrdering() {
      this.inherited(arguments);
      dojo.place("player_panel_game_information", "player_boards", "after");
    },
    iyeHelpContent: function () {
      return `
        <div class="game-help-wrapper">
            ${this.gameObjectiveHelpSection()}
            ${this.turnStructureHelpSection()}
            ${this.endGameScoringHelpSection()}
            ${this.naturalMovementHelpSection()}
            ${this.iyeMovementHelpSection()}
        </div>
      `;
    },
    gameObjectiveHelpSection: function () {
      const gameObjectiveDescription = _(
        "IYE is played between 2 players with alternating turns. The game continues until either one player has no valid moves or both players have taken 12 turns, which means a single IYE token is left on the board. If the game ends with a player having no valid moves, that player loses immediately. If the game ends after both players have taken 12 turns, an endgame scoring determines the winner of the game."
      );

      return `
        <div class="game-help-section">
          <span class="title">${_("Game Objective")}</span>
          <span class="description">${gameObjectiveDescription}</span>
        </div>
      `;
    },
    turnStructureHelpSection: function () {
      const turnStructureDescription = _(
        "Every turn, the active player moves KAM to a new position by either using natural movement or spending IYE from their supply. After moving KAM to a position, the active player gifts IYE on that position to their opponent, who may utilize it in future turns."
      );

      return `
        <div class="game-help-section">
          <span class="title">${_("Turn Structure")}</span>
          <span class="description">${turnStructureDescription}</span>
        </div>
      `;
    },
    endGameScoringHelpSection: function () {
      const endGameWithNoValidMovementDescription = _(
        "If the end of the game is triggered because there are no possible KAM movement positions, the active player instantly loses the game."
      );

      const endGameWithNormalDescription = _(
        "If the end of the game is triggered with only one IYE token left on the board, both players calculate their scores based on the remaining IYE tokens in their supplies. If a player has a majority of IYE tokens, they will receive points based on the chart below. In case of a tie, neither player scores. The player with the highest score wins the game."
      );

      return `
        <div class="game-help-section">
          <span class="title">${_("End of the Game")}</span>
          <span class="description">${endGameWithNoValidMovementDescription}</span>
          <span class="description">${endGameWithNormalDescription}</span>
          ${this.tokenDistributionTable()}
        </div>
      `;
    },
    tokenDistributionTable: function () {
      return `
        <table class="token-distribution-table">
          <tr>
            <th class="row-title"></th>
            <th><div class="help-token" data-token-type="sun"></div></th>
            <th><div class="help-token" data-token-type="horse"></div></th>
            <th><div class="help-token" data-token-type="tree"></div></th>
            <th><div class="help-token" data-token-type="water"></div></th>
            <th><div class="help-token" data-token-type="owl"></div></th>
          </tr>
          <tr>
            <td class="row-title">Token Amount</td>
            <td>9</td>
            <td>7</td>
            <td>5</td>
            <td>3</td>
            <td>1</td>
          </tr>
          <tr>
            <td class="row-title">Points on Majority</td>
            <td>9</td>
            <td>7</td>
            <td>5</td>
            <td>3</td>
            <td>1</td>
          </tr>
        </table>
      `;
    },
    naturalMovementHelpSection: function () {
      const naturalMovementDescription = _(
        "On the active player's turn, they can always move the KAM token 1 or 2 spaces orthogonally. This movement is always available and preferred when there is a valid target. There is no cost for this type of movement."
      );
      return `
        <div class="game-help-section">
          <span class="title">${_("Natural KAM Movement")}</span>
          <span class="description">${naturalMovementDescription}</span>
        </div>
      `;
    },
    iyeMovementHelpSection: function () {
      return `
        <div class="game-help-section">
          <span class="title">${_("IYE Based KAM Movement")}</span>
          <span class="description">This section is TODO</span>
        </div>
      `;
    },

    /* @Override */
    format_string_recursive: function format_string_recursive(log, args) {
      try {
        if (log && args && !args.processed) {
          args.processed = true;

          // Special keys to replace with images
          const keys = ["logSpentToken", "logTargetToken"];

          for (const i in keys) {
            const key = keys[i];
            if (key in args) {
              args[key] = this.getLogInjection(key, args);
            }
          }
        }
      } catch (e) {
        console.error(log, args, "Exception thrown", e.stack);
      }

      return this.inherited({ callee: format_string_recursive }, arguments);
    },
    getLogInjection: function (key, args) {
      switch (key) {
        case "logSpentToken":
        case "logTargetToken": {
          return `<div class="log_token" data-token-type=${args[key]}></div>`;
        }
      }
    },
  });
});
