Tiles = {
  EMPTY: "empty",
  VOID: "void",
  ROLLER: "roller",
  PUSHER: "pusher",
  GEAR:   "gear",
  REPAIR: "repair",
  OPTION: "option", 
  
  WALL: "wall",      // deprecated, use tile property 'wall' to define wall
                     // walls and lasers can be part of other tile types
    
  BOARD_WIDTH: 12,
  BOARD_HEIGHT: 12
};

(function (scope) {
  _boards = {
	DEFAULT: 0,
	TEST_BED_1: 1,
  CROSS: 2
  }
  var checkpoints = [];
  
  var _boardCache = [];
  

  scope.getStartPosition = function(players) {
    var game = Games.findOne(players[0].gameId);
    var board = Tiles.getBoardTiles(players.length,game.name);
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

  scope.checkCheckpoints = function(player,playerCount,boardName) {
    var tile = Tiles.getBoardTile(player.position.x, player.position.y,playerCount,boardName);
    if (tile.checkpoint && tile.checkpoint === player.visited_checkpoints+1) {
      Players.update(player._id, {$set: {visited_checkpoints: tile.checkpoint}});
      return true;
    }
    return false;
  };

  scope.isPlayerOnVoid = function(player,players) {
	var game = Games.findOne(player.gameId);
    var a = Tiles.getBoardTile(player.position.x, player.position.y,players.length,game.name).tileType == Tiles.VOID;
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
  

  scope.canMove = function(x, y, tx, ty,playerCount,gameName) {
    var tile = Tiles.getBoardTile(x, y,playerCount,gameName);
    var targetTile = Tiles.getBoardTile(tx, ty,playerCount,gameName);
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
  //   tile = Tiles.getBoardTile(x, y, playerCount, gameName)
  //   tile.tileType == Tiles.WALL && RegExp(direction).test(tile.elementDirection)
  //TODO: UNUSED
  scope.lineOfSight = function(x, y, tx, ty, playerCount, gameName) {
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

  scope.hasWall = function(x, y, direction, playerCount, gameName) {
    var tile = Tiles.getBoardTile(x, y, playerCount, gameName);
    return (tile.wall && RegExp(direction).test(tile.wall)); 
  };

  scope.getBoardTile = function(x, y, playerCount, boardName) {
    if (x < 0 || y < 0 || x >= Tiles.BOARD_WIDTH || y >= Tiles.BOARD_HEIGHT) {
      console.log("Invalid board tile", x, y);
      return null;
    }
    return Tiles.getBoardTiles(playerCount, boardName)[y][x];
  };
  scope.getBoardTiles = function(playerCount,boardName) {
    if (boardName === 'test_bed_1') {
  	  return Tiles.getBoardTEST_BED_1(playerCount).tiles;
    } else {
	    return Tiles.getBoardDefault(playerCount).tiles;
    }
  };
  scope.getCheckpointCount = function(playerCount, boardName) {
    if (boardName === 'test_bed_1') {
  	  return Tiles.getBoardTEST_BED_1(playerCount).checkpoints.length;
    } else {
	    return Tiles.getBoardDefault(playerCount).checkpoints.length;
    }
  }
  
  //TODO: Deprecate this function, board.jade should read the board object rather than relying
  //        on hard-coded variable names.
  scope.labelBoard = function(gameBoard) {
     
  	for(var i=0; i<gameBoard.startsX.length; ++i) {
        console.log('Start '+gameBoard.startsX[i]+','+gameBoard.startsY[i]+','+gameBoard.startsDirection[i]);
        gameBoard.tiles[gameBoard.startsX[i]][gameBoard.startsY[i]].start=true;
  	  gameBoard.tiles[gameBoard.startsX[i]][gameBoard.startsY[i]].direction = gameBoard.startsDirection[i];
    }
  	console.log('There are '+gameBoard.checkpoints.length+' in this game');
    
    for (var i in gameBoard.checkpoints) {
      var cp = gameBoard.checkpoints[i];
      console.log('Checkpoint '+(i+1)+' located at '+cp.x+','+cp.y);
      gameBoard.tiles[cp.x][cp.y].checkpoint=i+1;
    }
    gameBoard.tiles[cp.x][cp.y].finish=true;
  }
  
  scope.getBoardDefault = function(playerCount) {
    if (typeof _boardCache[_boards.DEFAULT]!=='undefined' && _boardCache[_boards.DEFAULT]!==null) {
      return _boardCache[_boards.DEFAULT];
    }
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
    startsX[0]=0; startsY[0]=2; startsDirection[0]=GameLogic.DOWN;
    startsX[1]=2; startsY[1]=0; startsDirection[1]=GameLogic.RIGHT;
    var checkpoints = [ {y:3, x:7, number:1}, 
                        {y:8, x:1, number:2},
                        {y:7, x:7, number:3}
                      ];

    _boardCache[_boards.DEFAULT] =
		{tiles: b,
		 startsX: startsX, startsY: startsY, startsDirection: startsDirection,
		 checkpoints: checkpoints};
    Tiles.labelBoard(_boardCache[_boards.DEFAULT]);
    return _boardCache[_boards.DEFAULT];
  };
    
  function Tile(type) {
    if (typeof(type) === 'undefined') {
      type = Tiles.EMPTY;
    }
    this.type = type;
    this.tileType = type;
    this.wall = false;
    this.damage = 0;
    
    this.path = function() {
      var p = "/tiles/"
      if (this.wall) {
        p += "wall-" + this.wall; 
      } else {
        switch(type) {
        case 'empty':
        case 'repair':
        case 'option':
        case 'gear':
        case 'pusher':
          p += 'empty-1';
          break;
        case 'roller':
          p += 'roller'
          if (this.move.x = -1) {
            p += '-left';
          } else if (this.move.x = 1) {
            p += '-right';
          } else if (this.move.y = -1) {
            p += '-up';
          } else if (this.move.y = 1) {
            p += '-down';
          } 
        case 'void':
          p += 'void-square';
          break;
        }
      }
      p += '.jpg';
      return p;
    }
  };
  
  function Board() {
    this.tiles = create2DArray(12);
    this.start_tiles=[];
    varthis.checkpoints=[];

    var dir_to_i = {u: 0, r:1, d:2, l:3 };
    var opp_dir  = {r:'l',        l:'r',        u:'d',     d:'u', 
                    right:'left', left:'right', up:'down', down:'up'};
    var long_dir = {r:'right',     l:'left',   u:'up', d:'down',
                    right:'right', left:'left',up:'up',down:'down'  };
                    
    for(var x=0;x<BOARD_WIDTH;++x) {
      for(var y=0;y<BOARD_HEIGHT;++y) {
        this.tiles[y][x] = new Tile();
      }
    }
    
    this.setType = function(y,x,type) {
      this.tiles[y][x].type = type;
      this.tiles[y][x].tileType = type;
    };
    
    this.addStart = function(y,x,direction) {
      start_tiles.push( {x:x, y:y, direction:direction} );
      
      this.tiles[y][x].start = true;     //TODO remove 'start' and 'direction' and use start_tiles in getStartPosition
      this.tiles[y][x].direction = true;
    };
    
    this.addCheckpoint = function(y,x) {
      var cnt = this.checkpoints.length;
      if (cnt > 0) {
        var last_cp = this.checkpoints[cnt-1];
        this.tiles[last_cp.y][last_cp.x].finish = false;
      }
      cnt += 1;
      this.checkpoints.push({x:x,y:y,number:cnt});
      this.tiles[y][x].checkpoint = cnt;
      this.tiles[y][x].finish = true;    
    };
          

    this.addWall = function(y,x,direction) {
      if (this.tiles[y][x].wall) {
        this.tiles[y][x].wall += '-' + direction;  
      } else {
        this.tiles[y][x].wall = direction;    
      }
    };
    
    this.addDoubleLaser = function(startX, startY, direction, length) {
      this.addLaser(startX, startY, direction, length, 2);
    };
      
    this.addLaser = function(startX, startY, direction, length, strength) {
      if(typeof(strength)==='undefined') strength = 1;
      this.addWall(startY,startX,long_dir[opp_dir[direction]]); // lasers are always between walls      
      for(var i=0;i<length;++i) {
        this.tiles[startY][startX].damage = strength;
        startY = nextX(startX,direction);
        startX = nextY(startY,direction);
      }
      this.addWall(startY,startX,long_dir[direction]);
    };
      
    this.addExpressRoller = function(startX, startY, route) {  
      this.addRoller(startX, startY, route, 2);
    };
    
    this.addRoller = function(startX, startY, route, speed) {
      if(typeof(speed)==='undefined') speed = 1;
      var last_dir = '';
      var cur_dir = route.charAt(0);

      this.setType(startX, startY, Tiles.ROLLER);
      this.tiles[startX][startY].move = step(cur_dir);
      this.tiles[startX][startY].speed = speed;
          
      for(var i=1;i<route.length;++i) {
        last_dir = route.charAt(i-1);
        cur_dir = route.charAt(i);
        if (last_dir !== cur_dir) {   // not the curved conveyor belt but the previous one rotates the robot
          var rot = dir_to_i[cur_dir] - dir_to_i[last_dir]
          if (rot === -1 || rot === 3) {
            this.tiles[startX][startY].rotate = -1;  
          } else {
            this.tiles[startX][startY].rotate = 1;
          }
        }
        startX = nextX(startX, last_dir);
        startY = nextY(startY, last_dir);
        this.tiles[startX][startY].move = step(cur_dir);
        this.tiles[startX][startY].speed = speed;
        this.setType(startX,startY,Tiles.ROLLER);
      }
    };
  
    this.setVoid = function(y,x) {
      this.setType(x,y,Tiles.VOID);
    };
    this.addRepair = function(y,x) {
      this.repair = true;
    };
    this.addOption = function(y,x) {
      this.tiles[y][x].repair = true;
      this.tiles[y][x].option = true;
    };
  
    this.addPusher = function(y,x, direction, pusher_type) {
      this.setType(y,x, Tiles.PUSHER);
      this.tiles[y][x].move = step(direction);
      if (active == 'even') {
        this.tiles[y][x].pusher_type = 0;
      } else {
        this.tiles[y][x].pusher_type = 1;
      }
    };
  };
  
  scope.getBoardCross = function(playerCount) {
    if (typeof _boardCache[_boards.CROSS]!=='undefined' && _boardCache[_boards.CROSS]!==null) {
      return _boardCache[_boards.CROSS];
    }
    var board = new Board();

    board.addWall(0,2, "up");
    board.addWall(0,7, "up");
    board.addWall(0,9, "up");
    board.addWall(2,0, "left");
    board.addWall(2,11,"right");
    board.addWall(3,1, "right-down");
    board.addWall(3,3, "right");
    board.addWall(3,7, "left-down");
    board.addWall(4,0, "left");
    board.addWall(4,9, "down");
    board.addWall(4,11,"right");
    board.addWall(7,0, "left-down");
    board.addWall(7,7, "left-up");
    board.addWall(7,10,"up");
    board.addWall(7,11,"right");
    board.addWall(8,4, "up");
    board.addWall(9,0, "left");
    board.addWall(9,2, "right");
    board.addWall(9,11,"right");
    board.addWall(11,2,"down");
    board.addWall(11,4,"down");
    board.addWall(11,7,"right-down");
    board.addWall(11,9,"down");
      
    board.addRoller(0,1,"ddrrrrddldldlll");
    board.addRoller(0,5,"dd");
    board.addRoller(1,11,"llu");
    board.addRoller(5,11,"llllluluuuu");
    board.addRoller(6,0,"rrrrrdrdddd");
    board.addRoller(0,10,"rrd");
    board.addRoller(11,10,"uulllluuuurrrrr");
    board.addRoller(11,6,"uu");
      
    board.addLaser(0,4, "d", 3);
    board.addDoubleLaser(1,8, "d", 3);
    board.addLaser(8,2, "r", 2);
    board.addLaser(8,7, "r", 2);
    
    board.addRepair(0,11);
    board.addRepair(9,0);
    board.addOption(3,2);
    board.addOption(7,9);
      
    board.setVoid(2,9);
    board.setVoid(1,4);
    board.setVoid(2,4);
    board.setVoid(5,4);
    board.setVoid(6,3);
    board.setVoid(6,4);
    board.setVoid(6,5);
    board.setVoid(7,4);
    board.setVoid(8,9);
    board.setVoid(10,2);
    board.setVoid(11,0);
        
    board.addStart(0,2, GameLogic.DOWN);
    board.addStart(2,0, GameLogic.RIGHT);
    board.addCheckpoint(3,7);
    board.addCheckpoint(8,1);
    board.addCheckpoint(7,7);

    _boardCache[_boards.CROSS] = board;
    return _boardCache[_boards.CROSS];
  };

  scope.getBoardTEST_BED_1 = function(playerCount) {
    if (typeof _boardCache[_boards.TEST_BED_1]!=='undefined' && _boardCache[_boards.TEST_BED_1]!==null) {
      return _boardCache[_boards.TEST_BED_1];
    }
    var b = create2DArray(12);

    for(var x=0;x<12;++x)
      for(var y=0;y<12;++y)
        b[x][y] = getTile(Tiles.EMPTY, "1");
		
    var startsX=[];
    var startsY=[];
    var startsDirection=[];
    startsX[0]=0; startsY[0]=2; startsDirection[0]=GameLogic.DOWN;
    startsX[1]=2; startsY[1]=0; startsDirection[1]=GameLogic.RIGHT;
    
    var checkpoints = [ {y:2, x:2, number:1}, 
                        {y:3, x:3, number:2},
                      ];

    _boardCache[_boards.TEST_BED_1]=
        {tiles: b,
		 startsX: startsX, startsY: startsY, startsDirection: startsDirection,
		 checkpoints: checkpoints,};
    Tiles.labelBoard(_boardCache[_boards.TEST_BED_1]);
    return _boardCache[_boards.TEST_BED_1];
  };
 
  function create2DArray(rows) {
    var arr = [];
    for (var i = 0; i < rows; i++) {
      arr[i] = [];
    }
    return arr;
  };

  function getTile(tileType, direction) {
    var x = { path: "/tiles/" + tileType + "-" + direction + ".jpg", 
              tileType: tileType, 
              type: tileType,
              damage: 0,
              move: { x:0, y:0 },
              rotate: 0,
              wall: false,
              repair: false,
              option: false
            };
    
    switch(tileType) {
      case Tiles.ROLLER:
        x.description = "This is a converyor belt. You will move 1 space in the direction of the arrow when ending here after a card has been played.";
        x.move = step(direction);
        break;
      case Tiles.VOID:
        x.description = "Don't fall in this giant hole in the ground or you'll die..";
        break;
      case Tiles.WALL:
      case Tiles.CORNER:
        x.wall = direction;
        x.description = "Even awesome robots can't pass through these massive walls.";
        break;
    }
    return x;
  };
  
  stepX = function(direction) {
    if (direction === 'l' || direction === 'left') {
        return -1;
    } else if (direction === 'r' || direction === 'right') {
        return 1;
    } else {
        return 0;
    }
  };
  
  stepY = function(direction) {
    if (direction === 'u' || direction === 'up') {
        return -1;
    } else if (direction === 'd' || direction === 'down') {
        return 1;
    } else {
        return 0;
    }
  };
  
  step = function(dir) {
    return {x:stepX(dir), y:stepY(dir)};
  };
  
  nextX = function(x, direction) {
    return x + stepX(direction);
  };
    
  nextY = function(y, direction) {
    return y + stepY(direction);
  };
})(Tiles);
