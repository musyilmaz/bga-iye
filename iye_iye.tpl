{OVERALL_GAME_HEADER}

<div class="play_area_wrapper">
  <div id="information_zone_wrapper">
    <div id="information_zone"></div>
    <div id="player_zone_wrapper">
      <!-- BEGIN player_zones -->
      <div id="player_{PLAYER_ID}" class="player_board whiteblock">
        <div class="player_name" style="color: #{PLAYER_COLOR}">
          {PLAYER_NAME}
        </div>
        <div class="token_zone">
          <!-- BEGIN player_tokens -->
          <div class="player_token_wrapper" id="player_{PLAYER_ID}_token_{TOKEN_TYPE}_wrapper">
            <div id="player_{PLAYER_ID}_token" class="player_token" data-token-type="{TOKEN_TYPE}"></div>
            <div id="player_{PLAYER_ID}_token_{TOKEN_TYPE}_amount" class="player_token_amount"></div>
          </div>
          <!-- END player_tokens -->
        </div>
      </div>
      <!-- END player_zones -->
    </div>
  </div>
  <div id="iye_board">
    <div id="iye_tokens"></div>
  </div>
</div>

<script type="text/javascript">

  var jstpl_player_board = '\
    <div id="player_board_${player_id}" class="iye_player_board">\
      <div class="player_board_token ${sun.present}" data-token-type="sun"><span class="amount">${sun.amount}</span></div>\
      <div class="player_board_token ${horse.present}" data-token-type="horse"><span class="amount">${horse.amount}</span></div>\
      <div class="player_board_token ${tree.present}" data-token-type="tree"><span class="amount">${tree.amount}</span></div>\
      <div class="player_board_token ${water.present}" data-token-type="water"><span class="amount">${water.amount}</span></div>\
      <div class="player_board_token ${owl.present}" data-token-type="owl"><span class="amount">${owl.amount}</span></div>\
    </div>\
  ';
</script>  

{OVERALL_GAME_FOOTER}
