Tiles = {
  EMPTY:  "empty",
  VOID:   "void",
  ROLLER: "roller",
  PUSHER: "pusher",
  GEAR:   "gear",
  REPAIR: "repair",
  OPTION: "option",

  BOARD_NAMES: [ 'default', 'vault', 'moving_targets' ],

  boards: {
    default: function() {
      var board = new Board(1);
      board.name = 'default';
      board.title = 'Default';
      board.addRallyArea('default');
      board.addStartArea('simple');
      board.addCheckpoint(7, 3);
      board.addCheckpoint(1, 8);
      board.addCheckpoint(7, 7);
      return board;
    },
    vault: function() {
      var board = new Board(1);
      board.name = 'vault';
      board.title = 'Option World';
      board.addRallyArea('vault');
      board.addStartArea('roller');
      board.addCheckpoint(3, 5);
      board.addCheckpoint(9, 1);
      board.addCheckpoint(5, 8);
      board.addCheckpoint(2, 0);
      return board;
    },
    moving_targets: function() {
      var board = new Board(2,8);
      board.name = 'moving_targets';
      board.title = 'Moving Targets';
      board.addRallyArea('maelstrom');
      board.addStartArea('simple');
      board.addCheckpoint(1,0);
      board.addCheckpoint(10,11);
      board.addCheckpoint(11,5);
      board.addCheckpoint(0,6);
      return board;
    }

  }
};

(function (scope) {
  var checkpoints = [];
  var _boardCache = [];

  scope.getStartPosition = function(players,playerNum) {
    var game = Games.findOne(players[playerNum].gameId);
    var board= Tiles.getBoard(game);
    var start_tile = board.start_tiles[playerNum];
    if (Tiles.isPlayerOnTile(players, start_tile.x, start_tile.y) === null) {
      return start_tile;
    //TODO: Get collision logic working.
    } else {
      return {x: 0, y: 0, direction: 0};
    }
  };
  
  scope.updateStartPosition = function(player, game) {
    player.start = {x: player.position.x, y:player.position.y};
  };

  scope.checkCheckpoints = function(player,game) {
    var tile = Tiles.getBoardTile(player.position.x, player.position.y,game);
    if (tile.checkpoint) {
      Tiles.updateStartPosition(player, game);
      if (tile.checkpoint === player.visited_checkpoints+1) {
        player.visited_checkpoints++;
      }
      Players.update(player._id, player);
      return true;
    }
    return false;
  };



  scope.isPlayerOnVoid = function(player, game) {
    var a = Tiles.getBoardTile(player.position.x, player.position.y, game).type == Tiles.VOID;
    if (a) {
      console.log("Player fell into the void", player.name);
    }
    return a;
  };

  scope.isPlayerOnBoard = function(player, game) {
    var board = Tiles.getBoard(game);
    var a = player.position.x >= 0 && player.position.y >= 0 && player.position.x < board.width && player.position.y < board.height;
    if (!a) {
      console.log("Player fell off the board", player.name);
    }
    return a;
  };

  scope.isPlayerOnTile = function(players, x, y) {
    var found = null;
    players.forEach(function(player) {
      if (player.position.x == x && player.position.y == y) {
        found = player;
      }
    });
    return found;
  };


  scope.canMove = function(x, y, tx, ty,game) {
    var tile = Tiles.getBoardTile(x, y,game);
    var targetTile = Tiles.getBoardTile(tx, ty,game);
    var tileSide = "na";
    var targetTileSide = "na";

    if (x > tx) {
      tileSide = "left";
      targetTileSide = "right";
    } else if (x < tx) {
      tileSide = "right";
      targetTileSide = "left";
    } else if (y > ty) {
      tileSide = "up";
      targetTileSide = "down";
    } else if (y < ty) {
      tileSide = "down";
      targetTileSide = "up";
    }

    if (tile.wall && String(tile.wall).indexOf(tileSide) > -1) {
      return false;
    }
    if (targetTile !== null && targetTile.wall && String(targetTile.wall).indexOf(targetTileSide) > -1) {
      return false;
    }

    return true;
  };

  scope.hasWall = function(x, y, direction, game) {
    var tile = Tiles.getBoardTile(x, y, game);
    return (tile.wall && RegExp(direction).test(tile.wall));
  };

  scope.getCheckpointCount = function(game) {
    return Tiles.getBoard(game).checkpoints.length;
  };

  scope.getBoardTile = function(x, y, game) {
    return Tiles.getBoard(game).getTile(x,y);
  };

  scope.getBoardTiles = function(game) {
	  return Tiles.getBoard(game).tiles;
  };

  scope.getBoard = function(game) {
    if (typeof(_boardCache[game.boardId])==='undefined' || _boardCache[game.boardId]===null) {
      var board_name = Tiles.BOARD_NAMES[game.boardId];
      console.log("Load "+board_name+" board");
      _boardCache[game.boardId] = Tiles.boards[board_name]();
    }
    return _boardCache[game.boardId];
  };


})(Tiles);
