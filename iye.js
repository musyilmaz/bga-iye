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
            title: _("Quick Rules"),
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
        tokenState && tokenState.board
          ? tokenState.board.filter((t) => t.type !== "kam")
          : [],
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
            this.actionButtonsRoundEndConfirmation(args);
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
      for (let playerId in players) {
        const playerTokens = {};

        Object.values(tokenTypes).map((token) => {
          const tokens = (playerTokenState || []).filter(
            (pts) => pts.player === playerId && pts.type === token.type
          );

          playerTokens[token.type] = {
            present: tokens.length > 0,
            amount: tokens.length,
          };
        });

        const roundScore = (playerRoundScores || []).filter(
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

      if (tokenState && tokenState.board && Array.isArray(tokenState.board)) {
        tokenState.board.map((token) => {
          this.placeTokenOnBoard(token);
        });
      }
    },
    clearTokens: function () {
      const tokens = document.getElementById("iye_tokens");
      if (tokens) {
        tokens.innerHTML = null;
      }
    },
    placeTokenOnBoard: function (token) {
      if (!token) return;

      const { x, y, type } = token;
      const tokens = document.getElementById("iye_tokens");
      if (!tokens) return;

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
      if (kamToken && targetSquare) {
        this.slideToObject(kamToken, targetSquare).play();
      }
    },
    moveKamToTargetSquare: function (targetSquare) {
      const kamToken = document.getElementsByClassName("kam")[0];
      if (kamToken && targetSquare) {
        this.slideToObject(kamToken, targetSquare).play();
      }
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
    actionButtonsRoundEndConfirmation: function (args) {
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
        tokenState && tokenState.board
          ? tokenState.board.filter((t) => t.type !== "kam")
          : [],
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
      if (this.isCurrentPlayerActive()) {
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
        tokenState && tokenState.board
          ? tokenState.board.filter((t) => t.type !== "kam")
          : [],
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
          ${this.gameSummaryHelpSection()}
          ${this.gameStructureHelpSection()}
          ${this.endOfCycleHelpSection()}
        </div>
      `;
    },
    gameSummaryHelpSection: function () {
      const gameDescription = _(
        "Iye is a two-player board game played in cycles with alternating turns. The game consists of one or more cycles, with players competing to win either 1 cycle (quick game) or 2 cycles (standard game)."
      );

      const gameCycleDescription = _(
        "A cycle ends under two conditions: either when a player has no valid moves remaining, or when both players have completed 12 turns each, leaving just a single Iye token on the board. If a player cannot make a valid move, they immediately lose the cycle. If both players complete their 12 turns, the winner of the cycle is determined through end-cycle scoring."
      );

      return `
        <div class="game-help-section">
          <span class="title">${_("Game Objective")}</span>
          <p class="description">${gameDescription}</p>
          <p class="description">${gameCycleDescription}</p>
        </div>
      `;
    },
    gameStructureHelpSection: function () {
      const iyeMovementDescription = _(
        "On your turn, you have to perform a <b>Natural Movement</b> or an <b>Iye Tile Movement</b> to move the shaman's drum. Empty board spaces cannot be a target for drum movement."
      );

      const naturalMovementDescription = _(
        "Move the drum 1 or 2 spaces. You can only move it vertically or horizontally."
      );
      const iyeTileMovementDescription = _(
        "Spend one of your iye tiles to utilise its special ability."
      );

      return `
        <div class="game-help-section">
          <span class="title">${_("Game Structure")}</span>
          <p class="description">${iyeMovementDescription}</p>
          <span class="small-title">${_("Natural Movement")}</span>
          <p class="description">${naturalMovementDescription}</p>
          <span class="small-title">${_("Iye Tile Movement")}</span>
          <p class="description">${iyeTileMovementDescription}</p>
          ${this.iyeTileMovementAndCountDistributionTable()}
        </div>
      `;
    },
    endOfCycleHelpSection: function () {
      const endOfCycleDescription = _(
        "There are two ways for a cycle to end; (1) no legal moves for the current player, (2) only a single iye tile left on the game board."
      );

      const noValidMovementDescription = _(
        "If a cycle ends because a player was not able to move, that player loses the cycle. In this case, there is no need for scoring."
      );

      const endOfCycleScoringDescription = _(
        "If a cycle ends because there is a single iye tile left on the board, scoring ensues. Each type of iye is scored separately. <b>Whoever holds the greatest count of a particular type of iye, receives all the points for that type.</b> If both players hold an equal number of tiles regarding a type of iye, neither player scores any points."
      );

      const endOfCycleWinnerDescription = _(
        "After every single type of iye has been scored, the player with the greater amount of points wins the cycle. The player who lost the cycle chooses the next cycle's first player."
      );

      const noCycleWinnerDescription = _(
        "If the scores are tied, the cycle has no winners."
      );

      return `
        <div class="game-help-section">
          <span class="title">${_("Enf of Cycle and Scoring")}</span>
          <p class="description">${endOfCycleDescription}</p>
          <p class="description">${noValidMovementDescription}</p>
          <p class="description">${endOfCycleScoringDescription}</p>
          <p class="description">${noCycleWinnerDescription}</p>
        </div>
      `;
    },
    iyeTileMovementAndCountDistributionTable: function () {
      return `
        <table class="token-distribution-table">
          <tr>
            <th class="row-title">Iye</th>
            <th class="row-title">Token Amount</th>
            <th class="row-title">Points for Majority</th>
            <th class="row-title">Special Movement Ability</th>
          </tr>
          <tr>
            <th><div class="help-token" data-token-type="owl"></div></th>
            <th>1</th>
            <th>1</th>
            <th class="information-cell">Move to any tile.</th>
          </tr>
          <tr>
            <th><div class="help-token" data-token-type="water"></div></th> 
            <th>3</th>
            <th>3</th>
            <th class="information-cell">Move any number of spaced in any direction including diagonal.</th>
          </tr>
          <tr>
            <th><div class="help-token" data-token-type="tree"></div></th>
            <th>5</th>
            <th>5</th>
            <th class="information-cell">Move one space diagonally.</th>
          </tr>
          <tr>            
            <th><div class="help-token" data-token-type="horse"></div></th>
            <th>7</th>
            <th>7</th>
            <th class="information-cell">Move in an <b>L</b> pattern.</th>
          </tr>
          <tr>            
            <th><div class="help-token" data-token-type="sun"></div></th>
            <th>9</th>
            <th>9</th>
            <th class="information-cell">Move to one of the four corners on the board.</th>
          </tr>
        </table>
      `;
    },
    iyeTilePointsAndDistributionTable: function () {
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
          return `<div class="log_token" data-token-type="${args[key]}"></div>`;
        }
      }
    },
  });
});
