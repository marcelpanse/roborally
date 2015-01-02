Tiles = {
  EMPTY: "empty",
  VOID: "void",
  WALL: "wall",
  CORNER: "corner",
  ROLLER: "roller",
  BOARD_WIDTH: 12,
  BOARD_HEIGHT: 12
};

(function (scope) {
  var _boardCache = null;

  scope.getStartPosition = function(players) {
    var board = Tiles.getBoardTiles();
    for (var y in board) { //rows
      var cols = board[y];
      for (var x in cols) { //cols
        var tile = cols[x];
        if (tile.start) {
          //check if no player is already there
          if (Tiles.isPlayerOnTile(players, x, y) === null) {
            return {x: Number(x), y: Number(y), direction: board[y][x].direction};
          }
        }
      }
    }
    return {x: 0, y: 0, direction: 0};
  };

  scope.isPlayerOnFinish = function(player) {
    return Tiles.getBoardTile(player.position.x, player.position.y).finish;
  };

  scope.checkCheckpoints = function(player) {
    if (!player.checkpoint1 && Tiles.getBoardTile(player.position.x, player.position.y).checkpoint1) {
      Players.update(player._id, {$set: {checkpoint1: true}});
      return true;
    }
    if (player.checkpoint1 && !player.checkpoint2 && Tiles.getBoardTile(player.position.x, player.position.y).checkpoint2) {
      Players.update(player._id, {$set: {checkpoint2: true}});
      return true;
    }
    return false;
  };

  scope.isPlayerOnVoid = function(player) {
    var a = Tiles.getBoardTile(player.position.x, player.position.y).tileType == Tiles.VOID;
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

  scope.canMove = function(x, y, tx, ty) {
    var tile = Tiles.getBoardTile(x, y);
    var targetTile = Tiles.getBoardTile(tx, ty);
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
  //     return false if scope.hasWall(x, minY, 'down')
  //     return false if scope.hasWall(x, maxY, 'up')

  //     for i in [minY+1...maxY]
  //       return false if scope.hasWall(x, i, 'down|up')
  //   else if y ==ty
  //     [minX,maxX] = [x, tx]
  //     return false if scope.hasWall(minX, y, 'right')
  //     return false if scope.hasWall(maxX, y, 'left')

  //     for i in [minX+1...maxX]
  //       return false if scope.hasWall(i, y, 'left|right')
  //   else
  //     return false
  //   true

  // scope.hasWall = (x, y, direction) ->
  //   tile = Tiles.getBoardTile(x, y)
  //   tile.tileType == Tiles.WALL && RegExp(direction).test(tile.elementDirection)
  scope.lineOfSight = function(x, y, tx, ty) {
    var i, maxX, maxY, minX, minY, _i, _j, _ref, _ref1, _ref2, _ref3;
    if (x === tx) {
      _ref = [y, ty].sort(), minY = _ref[0], maxY = _ref[1];
      if (scope.hasWall(x, minY, 'down')) {
        return false;
      }
      if (scope.hasWall(x, maxY, 'up')) {
        return false;
      }
      for (i = _i = _ref1 = minY + 1; _ref1 <= maxY ? _i < maxY : _i > maxY; i = _ref1 <= maxY ? ++_i : --_i) {
        if (scope.hasWall(x, i, 'down|up')) {
          return false;
        }
      }
    } else if (y === ty) {
      _ref2 = [x, tx], minX = _ref2[0], maxX = _ref2[1];
      if (scope.hasWall(minX, y, 'right')) {
        return false;
      }
      if (scope.hasWall(maxX, y, 'left')) {
        return false;
      }
      for (i = _j = _ref3 = minX + 1; _ref3 <= maxX ? _j < maxX : _j > maxX; i = _ref3 <= maxX ? ++_j : --_j) {
        if (scope.hasWall(i, y, 'left|right')) {
          return false;
        }
      }
    } else {
      return false;
    }
    return true;
  };

  scope.hasWall = function(x, y, direction) {
    var tile = Tiles.getBoardTile(x, y);
    return tile.tileType === Tiles.WALL && RegExp(direction).test(tile.elementDirection);
  };

  scope.getBoardTile = function(x, y) {
    if (x < 0 || y < 0 || x >= Tiles.BOARD_WIDTH || y >= Tiles.BOARD_HEIGHT) {
      console.log("Invalid board tile", x, y);
      return null;
    }
    return Tiles.getBoardTiles()[y][x];
  };

  scope.getBoardTiles = function() {
    if (_boardCache !== null) { //cache the tiles.
      return _boardCache;
    }
    var b = create2DArray(12);

    // row 1
    b[0][0] = getTile(Tiles.EMPTY, "1");
    b[0][1] = getTile(Tiles.ROLLER, "down");
    b[0][2] = getTile(Tiles.WALL, "up"); b[0][2].start = true; b[0][2].direction = GameLogic.DOWN;
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
    b[2][0] = getTile(Tiles.WALL, "left"); b[2][0].start = true; b[2][0].direction = GameLogic.RIGHT;
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
    b[3][7] = getTile(Tiles.WALL, "left-down"); b[3][7].checkpoint1 = true;
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
    b[7][7] = getTile(Tiles.WALL, "left-up"); b[7][7].finish = true;
    b[7][8] = getTile(Tiles.EMPTY, "1");
    b[7][9] = getTile(Tiles.EMPTY, "1");
    b[7][10] = getTile(Tiles.WALL, "down");
    b[7][11] = getTile(Tiles.WALL, "right");

    // row 9
    b[8][0] = getTile(Tiles.EMPTY, "1");
    b[8][1] = getTile(Tiles.EMPTY, "2"); b[8][1].checkpoint2 = true;
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

    _boardCache = b;
    return b;
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
