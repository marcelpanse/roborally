
  

BoardBuilder = {
  startArea: {
    simple: function(board,startX,startY) {
      board.addWall(startX+2, startY+0,"up");
      board.addWall(startX+4, startY+0,"up");
      board.addWall(startX+7, startY+0,"up");
      board.addWall(startX+9, startY+0,"up");
      board.addWall(startX+1, startY+2,"left");
      board.addWall(startX+3, startY+2,"left");
      board.addWall(startX+5, startY+2,"left");
      board.addWall(startX+6, startY+2,"left");
      board.addWall(startX+8, startY+2,"left");
      board.addWall(startX+10,startY+2,"left");
      board.addWall(startX+11,startY+2,"left");
      board.addWall(startX+2, startY+3,"down");
      board.addWall(startX+4, startY+3,"down");
      board.addWall(startX+7, startY+3,"down");
      board.addWall(startX+9, startY+3,"down");
    
      board.addStart(startX+5, startY+2, GameLogic.UP);
      board.addStart(startX+6, startY+2, GameLogic.UP);
      board.addStart(startX+3, startY+2, GameLogic.UP);
      board.addStart(startX+8, startY+2, GameLogic.UP);
      board.addStart(startX+1, startY+2, GameLogic.UP);
      board.addStart(startX+10,startY+2, GameLogic.UP);
      board.addStart(startX+0, startY+2, GameLogic.UP);
      board.addStart(startX+11,startY+2, GameLogic.UP);
    }
  }
};

(function (scope) {
  scope.emptyBoard = function() {
    return new Board();
  };
  
  function Board() {
    this.tiles = create2DArray(16);
    this.start_tiles=[];
    this.checkpoints=[];

    var opp_dir  = {r:'l',        l:'r',        u:'d',     d:'u', 
                    right:'left', left:'right', up:'down', down:'up'};
 
    for(var y=0;y<Tiles.BOARD_HEIGHT;++y) {                    
      for(var x=0;x<Tiles.BOARD_WIDTH;++x) {
        this.tiles[y][x] = new Tile();
      }
    }
  
    this.setVoid = function(x,y) {
      this.setType(x,y,Tiles.VOID);
    };
    
    this.setRoller = function(startX, startY, route, speed) {
      if(typeof(speed)==='undefined') speed = 1;
      var last_dir = '';
      var cur_dir = route.charAt(0);
      var roller_type = 'straight';

      this.setRollerTileProp(startX, startY, roller_type, cur_dir, speed);

      for(var i=1;i<route.length;++i) {
        last_dir = route.charAt(i-1);
        cur_dir = route.charAt(i);
        if (last_dir !== cur_dir) {   // not the curved conveyor belt but the previous one rotates the robot
          var rot = str_to_dir(cur_dir) - str_to_dir(last_dir)
          if (rot === -1 || rot === 3) {
            this.tiles[startY][startX].rotate = -1; 
            roller_type = 'ccw'; 
          } else {
            this.tiles[startY][startX].rotate = 1;
            roller_type = 'cw';
          }
        } else {
          roller_type = 'straight';
        }
        startX = nextX(startX, last_dir);
        startY = nextY(startY, last_dir);

        this.setRollerTileProp(startX, startY, roller_type, cur_dir, speed);
      }
    };
    
    this.setExpressRoller = function(startX, startY, route) {  
      this.addRoller(startX, startY, route, 2);
    };
    
    this.setRepair = function(x,y) {
      this.repair = true;
    };
    this.setOption = function(x,y) {
      this.tiles[y][x].repair = true;
      this.tiles[y][x].option = true;
    };

    this.setPusher = function(x,y, direction, pusher_type) {
      this.setType(y,x, Tiles.PUSHER);
      this.tiles[y][x].move = step(direction);
      if (active == 'even') {
        this.tiles[y][x].pusher_type = 0;
      } else {
        this.tiles[y][x].pusher_type = 1;
      }
    };
    
  
    this.addStart = function(x,y,direction) {
      console.log('Start '+x+','+y+','+direction);
      this.start_tiles.push( {x:Number(x), y:Number(y), direction:direction} );
    
      this.tiles[y][x].start = true;     //TODO remove 'start' and 'direction' and use start_tiles in getStartPosition
    };
  
    this.addCheckpoint = function(x,y) {
      var cnt = this.checkpoints.length;
      if (cnt > 0) {
        var last_cp = this.checkpoints[cnt-1];
        this.tiles[last_cp.y][last_cp.x].finish = false;
      }
      cnt += 1;
      this.checkpoints.push({x:x,y:y,number:cnt});
      this.tiles[y][x].checkpoint = cnt;
      this.tiles[y][x].finish = true;   
      console.log('Checkpoint '+cnt+' located at '+x+','+y); 
    };
        

    this.addWall = function(x,y,direction) {
      if (this.tiles[y][x].wall) {
        this.tiles[y][x].wall += '-' + direction;  
      } else {
        this.tiles[y][x].wall = direction;    
      }
      var dirs = direction.split('-')
      for(var i in dirs) {
        this.tiles[y][x].addItem('wall', str_to_dir(dirs[i]));
      }
    };
  
    this.addDoubleLaser = function(startX, startY, direction, length) {
      this.addLaser(startX, startY, direction, length, 2);
    };
    
    this.addLaser = function(startX, startY, direction, length, strength) {
      var laser_type = 'laser'
      if(typeof(strength)==='undefined') strength = 1;
      if (strength === 2) { 
        laser_type = 'doublelaser'
      }    
      for(var i=0;i<length;++i) {
        this.tiles[startY][startX].damage = strength;
        this.tiles[startY][startX].addItem(laser_type, str_to_dir(direction));
        if (i === 0) {  // lasers are always between walls  
          this.addWall(startX,startY,long_dir[opp_dir[direction]]);
        } else if (i===length-1) {
          this.addWall(startX,startY,long_dir[direction]);
        }
        startY = nextY(startY,direction);
        startX = nextX(startX,direction);
      }
    };
    
    this.addStartArea = function(name,x,y) {
      scope.startArea[name](this,x,y);
    }
    
    
    this.setType = function(x,y,type) {
      this.tiles[y][x].type = type;
      this.tiles[y][x].tileType = type;
      switch(type) {
        case Tiles.ROLLER:
          this.tiles[y][x].description = "This is a converyor belt. You will move 1 space in the direction of the arrow when ending here after a card has been played.";
          break;
        case Tiles.VOID:
          this.tiles[y][x].description = "Don't fall in this giant hole in the ground or you'll die..";
          break;
        case Tiles.EMPTY:
          if (this.tiles[y][x].wall) {
            this.tiles[y][x].description = "Even awesome robots can't pass through these massive walls.";
          }
          break;
      }
    };
  
    this.setRollerTileProp = function(x,y, roller_type, direction, speed) {
      this.tiles[y][x].direction = str_to_dir(direction);
      this.tiles[y][x].move = step(direction);
      this.tiles[y][x].speed = speed;

      if (this.tiles[y][x].type === Tiles.ROLLER && this.tiles[y][x].roller_type !== roller_type) {
        var t = this.tiles[y][x].roller_type.split('-');
        t.push(roller_type);
        roller_type = t.sort().join('-');
      }
      this.tiles[y][x].roller_type = roller_type;
      this.setType(x,y,Tiles.ROLLER);
    };

  };
  
  
  function Item(type, direction) {
    this.style = style_direction(direction);
    this.path = "/tiles/"+ type + ".png";
    this.description = '';
    switch(type) {
    case 'wall':
      this.description =  "Even awesome robots can't pass through these massive walls.";
      break;
    case 'laser':
      this.description = "This is a laser. You will gain one damage.";
      break;
    }
  }

  function Tile(tile_type) {
    if (typeof(tile_type) === 'undefined') {
      tile_type = Tiles.EMPTY;
    }
    this.type = tile_type;
    this.tileType = tile_type;
    this.wall = false;
    this.items = [];
    this.damage = 0;
    this.direction = GameLogic.UP;
    this.roller_type = ''
  
    this.orientation_css = function() {
      return style_direction(this.direction);
    }
  
    this.path = function() {
      var p = "/tiles/"
      switch(this.type) {
      case 'empty':
      case 'repair':
      case 'option':
      case 'gear':
      case 'pusher':
        p += 'empty-1';
        break;
      case 'roller':
        p += 'roller-' + this.roller_type
      
        break;
      case 'void':
        p += 'void-square';
        break;
      default: 
        p += 'empty-2';
        break;
      }
      p += '.jpg';
      return p;
    };
  
    this.addItem = function(type, direction) {
      this.items.push(new Item(type,direction-this.direction));  // the items are inside of the tile span so the 
                                                                 // direction has to be relative to the tile orientation
    };
  
  };
  
  function create2DArray(rows) {
    var arr = [];
    for (var i = 0; i < rows; i++) {
      arr[i] = [];
    }
    return arr;
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

  style_direction = function(direction) {
    return "transform: rotate("+(90)*direction+"deg);"
  };

  str_to_dir = function(str) {
    return GameLogic[long_dir[str].toUpperCase()];
  };

  var long_dir = {r:'right',     l:'left',   u:'up', d:'down',
                  right:'right', left:'left',up:'up',down:'down'  };
})(BoardBuilder);