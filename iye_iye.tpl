{OVERALL_GAME_HEADER}

<div class="play_area_wrapper">
  <div id="information_zone_wrapper">
    <div id="information_zone"></div>
  </div>
  <div id="iye_board">
    <div id="iye_tokens"></div>
  </div>
</div>

<script type="text/javascript">

  var jstpl_player_board = '\
    <div id="player_board_${playerId}" class="iye_player_board">\
      <div class="player_board_token ${sun.present}" data-token-type="sun"><span class="amount">${sun.amount}</span></div>\
      <div class="player_board_token ${horse.present}" data-token-type="horse"><span class="amount">${horse.amount}</span></div>\
      <div class="player_board_token ${tree.present}" data-token-type="tree"><span class="amount">${tree.amount}</span></div>\
      <div class="player_board_token ${water.present}" data-token-type="water"><span class="amount">${water.amount}</span></div>\
      <div class="player_board_token ${owl.present}" data-token-type="owl"><span class="amount">${owl.amount}</span></div>\
    </div>\
  ';
</script>  

{OVERALL_GAME_FOOTER}
