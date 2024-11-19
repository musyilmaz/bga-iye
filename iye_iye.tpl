{OVERALL_GAME_HEADER}

<div class="play_area_wrapper">
  <div id="iye_board">
    <div id="iye_tokens"></div>
  </div>
</div>

<div id="player_panel_game_information"></div>

<script type="text/javascript">

  var jstpl_player_board = '\
    <div id="player_board_${playerId}" class="iye_player_board">\
      <div class="iye_player_token_area">\
        <div class="player_board_token" data-token-type="sun" data-present="${sun.present}">\
          <span class="amount" data-present="${sun.present}">${sun.amount}</span>\
        </div>\
        <div class="player_board_token" data-token-type="horse" data-present="${horse.present}">\
          <span class="amount" data-present="${horse.present}">${horse.amount}</span>\
        </div>\
        <div class="player_board_token" data-token-type="tree" data-present="${tree.present}">\
          <span class="amount" data-present="${tree.present}">${tree.amount}</span>\
        </div>\
        <div class="player_board_token" data-token-type="water" data-present="${water.present}">\
          <span class="amount" data-present="${water.present}">${water.amount}</span>\
        </div>\
        <div class="player_board_token" data-token-type="owl" data-present="${owl.present}">\
          <span class="amount" data-present="${owl.present}">${owl.amount}</span>\
        </div>\
      </div>\
      <div class="iye_player_round_score">\
        <span>Round Win: ${roundScore}</span>\
      </div>\
    </div>\
  ';

  var jstpl_game_information = '\
    <div class="player_panel_game_information">\
      <span class="title">${title}</span>\
      <span class="description">${description}</span>\
      <div class="token_breakdown">\
        <div class="game_information_token">\
          <div class="info_token" data-token-type="sun" data-present="${sun.present}"></div>\
          <span class="amount">${sun.amount} / ${sun.totalAmount}</span>\
          <span class="points">${sun.points} pts</span>\
        </div>\
        <div class="game_information_token">\
          <div class="info_token" data-token-type="horse" data-present="${horse.present}"></div>\
          <span class="amount">${horse.amount} / ${horse.totalAmount}</span>\
          <span class="points">${horse.points} pts</span>\
        </div>\
        <div class="game_information_token">\
          <div class="info_token" data-token-type="tree" data-present="${tree.present}"></div>\
          <span class="amount">${tree.amount} / ${tree.totalAmount}</span>\
          <span class="points">${tree.points} pts</span>\
        </div>\
        <div class="game_information_token">\
          <div class="info_token" data-token-type="water" data-present="${water.present}"></div>\
          <span class="amount">${water.amount} / ${water.totalAmount}</span>\
          <span class="points">${water.points} pts</span>\
        </div>\
        <div class="game_information_token">\
          <div class="info_token" data-token-type="owl" data-present="${owl.present}"></div>\
          <span class="amount">${owl.amount} / ${owl.totalAmount}</span>\
          <span class="points">${owl.points} pt</span>\
        </div>\
      </div>\
    </div>\
  ';
</script>  

{OVERALL_GAME_FOOTER}
