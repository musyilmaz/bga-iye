{OVERALL_GAME_HEADER}

<div class="play_area_wrapper">
  <div id="iye_board">
    <div id="iye_tokens"></div>
  </div>
</div>

<script type="text/javascript">

  var jstpl_player_board = '\
    <div id="player_board_${playerId}" class="iye_player_board">\
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
  ';
</script>  

{OVERALL_GAME_FOOTER}
