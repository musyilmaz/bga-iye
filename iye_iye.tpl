{OVERALL_GAME_HEADER}

<!-- 
--------
-- BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
-- iye implementation : © <Your name here> <Your email address here>
-- 
-- This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
-- See http://en.boardgamearena.com/#!doc/Studio for more information.
-------

    iye_iye.tpl
    
    This is the HTML template of your game.
    
    Everything you are writing in this file will be displayed in the HTML page of your game user interface,
    in the "main game zone" of the screen.
    
    You can use in this template:
    _ variables, with the format {MY_VARIABLE_ELEMENT}.
    _ HTML block, with the BEGIN/END format
    
    See your "view" PHP file to check how to set variables and control blocks
    
    Please REMOVE this comment before publishing your game on BGA
-->

<div class="play_area_wrapper">
  <div id="player_zone_wrapper">
    <!-- BEGIN player_zones -->
    <div id="player_{PLAYER_ID}" class="player_board whiteblock">
      <div class="player_name" style="color: #{PLAYER_COLOR}">
        {PLAYER_NAME}
      </div>
      <div class="token_zone">
        <!-- BEGIN player_tokens -->
        <div id="player_{PLAYER_ID}_token" class="player_token" data-token-type="{TOKEN_TYPE}">
          <div id="player_{PLAYER_ID}_token_{TOKEN_TYPE}_amount" class="player_token_amount"></div>
        </div>
        <!-- END player_tokens -->
      </div>
    </div>
    <!-- END player_zones -->
  </div>
  <div id="iye_board">
    <div id="iye_tokens"></div>
  </div>
</div>

<script type="text/javascript">

// Javascript HTML templates

/*
// Example:
var jstpl_some_game_item='<div class="my_game_item" id="my_game_item_${MY_ITEM_ID}"></div>';

*/

</script>  

{OVERALL_GAME_FOOTER}
