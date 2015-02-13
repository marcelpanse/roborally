Tiles = {
  EMPTY: "empty",
  VOID: "void",
  WALL: "wall",
  CORNER: "corner",
  ROLLER: "roller",
  BOARD_WIDTH: 12,
  BOARD_HEIGHT: 12,
  BOARD_DEFAULT: 0,
  BOARD_TEST_BED_1: 1
};

  (function (scope) {
  
  var _boardCache = [];

  scope.getStartPosition = function(players,playerNum) {
    var game = Games.findOne(players[playerNum].gameId);
    var board=Tiles.getBoard(game);

    if (Tiles.isPlayerOnTile(players, board.startsX[playerNum], board.startsY[playerNum]) === null) {
      return {x: Number(board.startsX[playerNum]), y: Number(board.startsY[playerNum]), direction: board.startsDirection[playerNum]};
    //TODO: Get collision logic working.
    } else {
      return {x: 0, y: 0, direction: 0};
    }
  };

  scope.isPlayerOnFinish = function(player,game) {
    return Tiles.getBoardTile(player.position.x, player.position.y,game).finish;
  };

  scope.checkCheckpoints = function(player,game) {
    if (!player.checkpoint1 && Tiles.getBoardTile(player.position.x, player.position.y,game).checkpoint1) {
      Players.update(player._id, {$set: {checkpoint1: true}});
      return true;
    }
    if (player.checkpoint1 && !player.checkpoint2 && Tiles.getBoardTile(player.position.x, player.position.y,game).checkpoint2) {
      Players.update(player._id, {$set: {checkpoint2: true}});
      return true;
    }
    return false;
  };

  scope.isPlayerOnVoid = function(player,players) {
	var game = Games.findOne(player.gameId);
    var a = Tiles.getBoardTile(player.position.x, player.position.y,game).tileType == Tiles.VOID;
    if (a) {
      console.log("Player fell into the void", player.name);
    }
    return a;
  };

  scope.isPlayerOnBoard = function(player) {
    var a = player.position.x >= 0 && player.position.y >= 0 && player.position.x < Tiles.BOARD_WIDTH && player.position.y < Tiles.BOARD_HEIGHT;
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

    if (tile.tileType == Tiles.WALL && String(tile.elementDirection).indexOf(tileSide) > -1) {
      return false;
    }
    if (targetTile !== null && targetTile.tileType == Tiles.WALL && String(targetTile.elementDirection).indexOf(targetTileSide) > -1) {
      return false;
    }

    return true;
  };

  // scope.lineOfSight = (x, y, tx, ty) ->
  //   if x == tx
  //     [minY,maxY] = [y,ty].sort()
  //     return false if scope.hasWall(x, minY, 'down',game)
  //     return false if scope.hasWall(x, maxY, 'up',game)

  //     for i in [minY+1...maxY]
  //       return false if scope.hasWall(x, i, 'down|up',game)
  //   else if y ==ty
  //     [minX,maxX] = [x, tx]
  //     return false if scope.hasWall(minX, y, 'right',game)
  //     return false if scope.hasWall(maxX, y, 'left',game)

  //     for i in [minX+1...maxX]
  //       return false if scope.hasWall(i, y, 'left|right',game)
  //   else
  //     return false
  //   true

  // scope.hasWall = (x, y, direction,game) ->
  //   tile = Tiles.getBoardTile(x, y, game)
  //   tile.tileType == Tiles.WALL && RegExp(direction).test(tile.elementDirection)
  //TODO: UNUSED
  scope.lineOfSight = function(x, y, tx, ty, game) {
    var i, maxX, maxY, minX, minY, _i, _j, _ref, _ref1, _ref2, _ref3;
    if (x === tx) {
      _ref = [y, ty].sort(), minY = _ref[0], maxY = _ref[1];
      if (scope.hasWall(x, minY, 'down',game)) {
        return false;
      }
      if (scope.hasWall(x, maxY, 'up',game)) {
        return false;
      }
      for (i = _i = _ref1 = minY + 1; _ref1 <= maxY ? _i < maxY : _i > maxY; i = _ref1 <= maxY ? ++_i : --_i) {
        if (scope.hasWall(x, i, 'down|up',game)) {
          return false;
        }
      }
    } else if (y === ty) {
      _ref2 = [x, tx], minX = _ref2[0], maxX = _ref2[1];
      if (scope.hasWall(minX, y, 'right',game)) {
        return false;
      }
      if (scope.hasWall(maxX, y, 'left',game)) {
        return false;
      }
      for (i = _j = _ref3 = minX + 1; _ref3 <= maxX ? _j < maxX : _j > maxX; i = _ref3 <= maxX ? ++_j : --_j) {
        if (scope.hasWall(i, y, 'left|right',game)) {
          return false;
        }
      }
    } else {
      return false;
    }
    return true;
  };

  scope.hasWall = function(x, y, direction,game) {
    var tile = Tiles.getBoardTile(x, y, game);
    return tile.tileType === Tiles.WALL && RegExp(direction).test(tile.elementDirection);
  };

  scope.getBoardTile = function(x, y, game) {
    if (x < 0 || y < 0 || x >= Tiles.BOARD_WIDTH || y >= Tiles.BOARD_HEIGHT) {
      console.log("Invalid board tile", x, y);
      return null;
    }
    //$$$DEBUG
    return Tiles.getBoardTiles(game)[y][x];
  };
  
  scope.getBoardTiles = function(game) {
	  return Tiles.getBoard(game).tiles;
  };
  
  scope.getBoard = function(game) {
    if (game.boardId === Tiles.BOARD_TEST_BED_1) {
  	  return Tiles.getBoardTEST_BED_1();
    } else {
	    return Tiles.getBoardDefault();
    }
  };
  
  //TODO: Deprecate this function, board.jade should read the board object rather than relying
  //        on hard-coded variable names.
  scope.labelBoard = function(gameBoard) {
	for(var i=0; i<gameBoard.startsX.length; ++i) {
    console.log('Start '+gameBoard.startsX[i]+','+gameBoard.startsY[i]+','+gameBoard.startsDirection[i]);
    gameBoard.tiles[gameBoard.startsY[i]][gameBoard.startsX[i]].start=true;
	  gameBoard.tiles[gameBoard.startsY[i]][gameBoard.startsX[i]].direction = gameBoard.startsDirection[i];
  }
	console.log('There are '+gameBoard.checkpointsX.length+' in this game');
	if(gameBoard.checkpointsX.length>=2) {
	  i=0;
      console.log('Checkpoint '+i+' located at '+gameBoard.checkpointsX[i]+','+gameBoard.checkpointsY[i]);
      gameBoard.tiles[gameBoard.checkpointsX[i]][gameBoard.checkpointsY[i]].checkpoint1=true;
    }
	if(gameBoard.checkpointsX.length>=3) {
	  i=1;
      console.log('Checkpoint '+i+' located at '+gameBoard.checkpointsX[i]+','+gameBoard.checkpointsY[i]);
      gameBoard.tiles[gameBoard.checkpointsX[i]][gameBoard.checkpointsY[i]].checkpoint2=true;
    }
    gameBoard.tiles[gameBoard.checkpointsX[gameBoard.checkpointsX.length-1]][gameBoard.checkpointsY[gameBoard.checkpointsX.length-1]].finish=true;
  }
  
  scope.getBoardDefault = function() {
    if (typeof _boardCache[Tiles.BOARD_DEFAULT]!=='undefined' && _boardCache[Tiles.BOARD_DEFAULT]!==null) {
      console.log("Board was cached");
      return _boardCache[Tiles.BOARD_DEFAULT];
    }
    console.log("Creating Board Default");
    var b = create2DArray(12);

    // row 1
    b[0][0] = getTile(Tiles.EMPTY, "1");
    b[0][1] = getTile(Tiles.ROLLER, "down");
    b[0][2] = getTile(Tiles.WALL, "up");
    b[0][3] = getTile(Tiles.EMPTY, "2");
    b[0][4] = getTile(Tiles.WALL, "up");
    b[0][5] = getTile(Tiles.ROLLER, "down");
    b[0][6] = getTile(Tiles.ROLLER, "up");
    b[0][7] = getTile(Tiles.WALL, "up");
    b[0][8] = getTile(Tiles.WALL, "down");
    b[0][9] = getTile(Tiles.WALL, "up");
    b[0][10] = getTile(Tiles.ROLLER, "up");
    b[0][11] = getTile(Tiles.EMPTY, "2");

    // row 2
    b[1][0] = getTile(Tiles.EMPTY, "1");
    b[1][1] = getTile(Tiles.ROLLER, "down");
    b[1][2] = getTile(Tiles.ROLLER, "right");
    b[1][3] = getTile(Tiles.ROLLER, "right");
    b[1][4] = getTile(Tiles.ROLLER, "right");
    b[1][5] = getTile(Tiles.ROLLER, "down");
    b[1][6] = getTile(Tiles.ROLLER, "up");
    b[1][7] = getTile(Tiles.EMPTY, "1");
    b[1][8] = getTile(Tiles.EMPTY, "1");
    b[1][9] = getTile(Tiles.WALL, "right-up");
    b[1][10] = getTile(Tiles.ROLLER, "up");
    b[1][11] = getTile(Tiles.ROLLER, "left");

    // row 3
    b[2][0] = getTile(Tiles.WALL, "left");
    b[2][1] = getTile(Tiles.EMPTY, "2");
    b[2][2] = getTile(Tiles.EMPTY, "1");
    b[2][3] = getTile(Tiles.EMPTY, "1");
    b[2][4] = getTile(Tiles.WALL, "down");
    b[2][5] = getTile(Tiles.ROLLER, "down");
    b[2][6] = getTile(Tiles.ROLLER, "up");
    b[2][7] = getTile(Tiles.WALL, "left");
    b[2][8] = getTile(Tiles.EMPTY, "1");
    b[2][9] = getTile(Tiles.VOID, "square");
    b[2][10] = getTile(Tiles.EMPTY, "2");
    b[2][11] = getTile(Tiles.WALL, "right");

    // row 4
    b[3][0] = getTile(Tiles.EMPTY, "1");
    b[3][1] = getTile(Tiles.WALL, "left-down");
    b[3][2] = getTile(Tiles.EMPTY, "2");
    b[3][3] = getTile(Tiles.EMPTY, "1");
    b[3][4] = getTile(Tiles.ROLLER, "down");
    b[3][5] = getTile(Tiles.ROLLER, "left");
    b[3][6] = getTile(Tiles.ROLLER, "up");
    b[3][7] = getTile(Tiles.WALL, "left-down");
    b[3][8] = getTile(Tiles.WALL, "down");
    b[3][9] = getTile(Tiles.EMPTY, "2");
    b[3][10] = getTile(Tiles.WALL, "down");
    b[3][11] = getTile(Tiles.EMPTY, "1");

    // row 5
    b[4][0] = getTile(Tiles.WALL, "left");
    b[4][1] = getTile(Tiles.VOID, "right");
    b[4][2] = getTile(Tiles.VOID, "left");
    b[4][3] = getTile(Tiles.ROLLER, "down");
    b[4][4] = getTile(Tiles.ROLLER, "left");
    b[4][5] = getTile(Tiles.VOID, "down");
    b[4][6] = getTile(Tiles.ROLLER, "up");
    b[4][7] = getTile(Tiles.ROLLER, "left");
    b[4][8] = getTile(Tiles.EMPTY, "2");
    b[4][9] = getTile(Tiles.WALL, "down");
    b[4][10] = getTile(Tiles.EMPTY, "2");
    b[4][11] = getTile(Tiles.WALL, "right");

    // row 6
    b[5][0] = getTile(Tiles.ROLLER, "left");
    b[5][1] = getTile(Tiles.ROLLER, "left");
    b[5][2] = getTile(Tiles.ROLLER, "left");
    b[5][3] = getTile(Tiles.ROLLER, "left");
    b[5][4] = getTile(Tiles.VOID, "right");
    b[5][5] = getTile(Tiles.VOID, "square");
    b[5][6] = getTile(Tiles.VOID, "left");
    b[5][7] = getTile(Tiles.ROLLER, "up");
    b[5][8] = getTile(Tiles.ROLLER, "left");
    b[5][9] = getTile(Tiles.ROLLER, "left");
    b[5][10] = getTile(Tiles.ROLLER, "left");
    b[5][11] = getTile(Tiles.ROLLER, "left");

    // row 7
    b[6][0] = getTile(Tiles.ROLLER, "right");
    b[6][1] = getTile(Tiles.ROLLER, "right");
    b[6][2] = getTile(Tiles.ROLLER, "right");
    b[6][3] = getTile(Tiles.ROLLER, "right");
    b[6][4] = getTile(Tiles.ROLLER, "down");
    b[6][5] = getTile(Tiles.VOID, "up");
    b[6][6] = getTile(Tiles.ROLLER, "right");
    b[6][7] = getTile(Tiles.ROLLER, "right");
    b[6][8] = getTile(Tiles.ROLLER, "right");
    b[6][9] = getTile(Tiles.ROLLER, "right");
    b[6][10] = getTile(Tiles.ROLLER, "right");
    b[6][11] = getTile(Tiles.ROLLER, "right");

    // row 8
    b[7][0] = getTile(Tiles.WALL, "left");
    b[7][1] = getTile(Tiles.WALL, "down");
    b[7][2] = getTile(Tiles.WALL, "up");
    b[7][3] = getTile(Tiles.WALL, "down");
    b[7][4] = getTile(Tiles.ROLLER, "right");
    b[7][5] = getTile(Tiles.ROLLER, "down");
    b[7][6] = getTile(Tiles.ROLLER, "up");
    b[7][7] = getTile(Tiles.WALL, "left-up");
    b[7][8] = getTile(Tiles.EMPTY, "1");
    b[7][9] = getTile(Tiles.EMPTY, "1");
    b[7][10] = getTile(Tiles.WALL, "down");
    b[7][11] = getTile(Tiles.WALL, "right");

    // row 9
    b[8][0] = getTile(Tiles.EMPTY, "1");
    b[8][1] = getTile(Tiles.EMPTY, "2");
    b[8][2] = getTile(Tiles.WALL, "left");
    b[8][3] = getTile(Tiles.EMPTY, "1");
    b[8][4] = getTile(Tiles.WALL, "left-up");
    b[8][5] = getTile(Tiles.ROLLER, "down");
    b[8][6] = getTile(Tiles.ROLLER, "up");
    b[8][7] = getTile(Tiles.WALL, "left");
    b[8][8] = getTile(Tiles.WALL, "right");
    b[8][9] = getTile(Tiles.VOID, "square");
    b[8][10] = getTile(Tiles.EMPTY, "2");
    b[8][11] = getTile(Tiles.EMPTY, "1");

    // row 10
    b[9][0] = getTile(Tiles.WALL, "left");
    b[9][1] = getTile(Tiles.EMPTY, "2");
    b[9][2] = getTile(Tiles.WALL, "down");
    b[9][3] = getTile(Tiles.EMPTY, "2");
    b[9][4] = getTile(Tiles.EMPTY, "1");
    b[9][5] = getTile(Tiles.ROLLER, "down");
    b[9][6] = getTile(Tiles.ROLLER, "up");
    b[9][7] = getTile(Tiles.EMPTY, "1");
    b[9][8] = getTile(Tiles.WALL, "left");
    b[9][9] = getTile(Tiles.EMPTY, "1");
    b[9][10] = getTile(Tiles.EMPTY, "2");
    b[9][11] = getTile(Tiles.WALL, "right");

    // row 11
    b[10][0] = getTile(Tiles.ROLLER, "right");
    b[10][1] = getTile(Tiles.ROLLER, "down");
    b[10][2] = getTile(Tiles.VOID, "square");
    b[10][3] = getTile(Tiles.EMPTY, "1");
    b[10][4] = getTile(Tiles.EMPTY, "1");
    b[10][5] = getTile(Tiles.ROLLER, "down");
    b[10][6] = getTile(Tiles.ROLLER, "up");
    b[10][7] = getTile(Tiles.ROLLER, "left");
    b[10][8] = getTile(Tiles.ROLLER, "left");
    b[10][9] = getTile(Tiles.ROLLER, "left");
    b[10][10] = getTile(Tiles.ROLLER, "left");
    b[10][11] = getTile(Tiles.EMPTY, "2");

    // row 12
    b[11][0] = getTile(Tiles.VOID, "square");
    b[11][1] = getTile(Tiles.ROLLER, "down");
    b[11][2] = getTile(Tiles.WALL, "down");
    b[11][3] = getTile(Tiles.EMPTY, "2");
    b[11][4] = getTile(Tiles.WALL, "down");
    b[11][5] = getTile(Tiles.ROLLER, "down");
    b[11][6] = getTile(Tiles.ROLLER, "up");
    b[11][7] = getTile(Tiles.WALL, "right-down");
    b[11][8] = getTile(Tiles.EMPTY, "1");
    b[11][9] = getTile(Tiles.WALL, "down");
    b[11][10] = getTile(Tiles.ROLLER, "up");
    b[11][11] = getTile(Tiles.EMPTY, "1");

    var startsX=[];
    var startsY=[];
    var startsDirection=[];
    var checkpointsX=[];
    var checkpointsY=[];
    startsX[0]=2; startsY[0]=0; startsDirection[0]=GameLogic.DOWN;
    startsX[1]=0; startsY[1]=2; startsDirection[1]=GameLogic.RIGHT;
    checkpointsX[0]=3; checkpointsY[0]=7;
    checkpointsX[1]=8; checkpointsY[1]=1;
    checkpointsX[2]=7; checkpointsY[2]=7;

    _boardCache[Tiles.BOARD_DEFAULT] =
		{tiles: b,
		 startsX: startsX, startsY: startsY, startsDirection: startsDirection,
		 checkpointsX: checkpointsX, checkpointsY: checkpointsY};
    Tiles.labelBoard(_boardCache[Tiles.BOARD_DEFAULT]);
    return _boardCache[Tiles.BOARD_DEFAULT];
  };

  scope.getBoardTEST_BED_1 = function() {
    if (typeof _boardCache[Tiles.BOARD_TEST_BED_1]!=='undefined' && _boardCache[Tiles.BOARD_TEST_BED_1]!==null) {
      return _boardCache[Tiles.BOARD_TEST_BED_1];
    }
    var b = create2DArray(12);

    for(var x=0;x<12;++x)
      for(var y=0;y<12;++y)
        b[x][y] = getTile(Tiles.EMPTY, "1");
		
    var startsX=[];
    var startsY=[];
    var startsDirection=[];
    var checkpointsX=[];
    var checkpointsY=[];
    startsX[0]=4; startsY[0]=1; startsDirection[0]=GameLogic.LEFT;
    startsX[1]=3; startsY[1]=1; startsDirection[1]=GameLogic.RIGHT;
    checkpointsX[0]=2; checkpointsY[0]=2;
    checkpointsX[1]=3; checkpointsY[1]=3;

    _boardCache[Tiles.BOARD_TEST_BED_1]=
        {tiles: b,
		 startsX: startsX, startsY: startsY, startsDirection: startsDirection,
		 checkpointsX: checkpointsX, checkpointsY: checkpointsY};
    Tiles.labelBoard(_boardCache[Tiles.BOARD_TEST_BED_1]);
    return _boardCache[Tiles.BOARD_TEST_BED_1];
  };
 
  function create2DArray(rows) {
    var arr = [];
    for (var i = 0; i < rows; i++) {
      arr[i] = [];
    }
    return arr;
  }

  function getTile(tileType, direction) {
    var x = { path: "/tiles/" + tileType + "-" + direction + ".jpg", tileType: tileType, elementDirection: direction };
    switch (tileType) {
      case Tiles.ROLLER:
        x.description = "This is a converyor belt. You will move 1 space in the direction of the arrow when ending here after a card has been played.";
        break;
      case Tiles.VOID:
        x.description = "Don't fall in this giant hole in the ground or you'll die..";
        break;
      case Tiles.WALL:
      case Tiles.CORNER:
        x.description = "Even awesome robots can't pass through these massive walls.";
        break;
    }
    return x;
  }

})(Tiles);
