
class @Board
  constructor: (min_player=2, max_player=8, width=12, height=16) ->
    @tiles = create2DArray(height)
    @start_tiles=[]
    @checkpoints=[]
    @min_player = min_player
    @max_player = max_player
    @height = height
    @width = width

    for y in [0..@height-1]
      for x in [0..@width-1]
        @tiles[y][x] = new Tile

  getTile: (x,y) ->
    if (x < 0 || y < 0 || x >= @width || y >= @height)
      console.log "Invalid board tile (#{x},#{y})"
      return null
    @tiles[y][x]

  addRallyArea: (name, x_offset=0, y_offset=0, orientation=0) ->
    @addArea(Area.course[name], x_offset, y_offset, orientation, 12, 12)

  addStartArea: (name, x_offset=0, y_offset=12, orientation=0) ->
    @addArea(Area.start[name], x_offset, y_offset, orientation, 12, 4)

             
  addArea: (build_area, x_offset, y_offset, orientation, width, height) ->
    @x_offset = x_offset
    @y_offset = y_offset
    @orientation = orientation
    @area_height = height
    @area_width = width
    build_area.call(this)
    @x_offset = 0
    @y_offset = 0
    @orientation = 0


  tile: (x,y) ->
    @tiles[@row(x,y)][@col(x,y)]

  col: (x,y) ->
    x += @x_offset
    y += @y_offset

    switch @orientation
      when 0 then x
      when 90 then y
      when 180 then @area_width-1-x
      when 270 then @area_height-1-y

  row: (x,y) ->
    x += @x_offset
    y += @y_offset

    switch @orientation
      when 0 then y
      when 90 then x
      when 180 then @area_height-1-y
      when 270 then @area_width-1-x

  
  
  setVoid: (x,y) ->
    @setType(x,y,Tiles.VOID)

  setRoller: (x, y, route, speed=1) ->
    cur_dir = route.charAt(0)
    roller_type = 'straight'
    @setRollerTileProp(x, y, roller_type, cur_dir, speed)

    last_dir = cur_dir
    for cur_dir in route[1..-1]
      # not the curved conveyor belt but the previous one rotates the robot
      if (last_dir != cur_dir)
        rot = str_to_dir(cur_dir) - str_to_dir(last_dir)
        if (rot == -1 || rot == 3)
          @tile(x,y).rotate = -1
          roller_type = 'ccw'
        else
          @tile(x,y).rotate = -1
          roller_type = 'cw'
      else
        roller_type = 'straight'
      
      x = nextX(x, last_dir)
      y = nextY(y, last_dir)
      @setRollerTileProp(x, y, roller_type, cur_dir, speed)
      
      last_dir = cur_dir

  setExpressRoller: (x, y, route) ->
    @setRoller(x, y, route, 2)

  setRepair: (x,y) ->
    @tile(x,y).repair = true
    @setType(x,y, Tiles.REPAIR)
  
  setOption: (x,y) ->
    @tile(x,y).repair
    @tile(x,y).repair = true
    @tile(x,y).option = true
    @setType(x, y, Tiles.OPTION)

  setGear: (x,y,gear_type) ->
    @setType(x,y, Tiles.GEAR)
    @tile(x,y).gear_type = gear_type
    if (gear_type == 'cw')
      @tile(x,y).rotate = -1
    else
      @tile(x,y).rotate = 1
    
  setPusher: (x,y, direction, pusher_type) ->
    @setType(x,y, Tiles.PUSHER)
    @tile(x,y).move = step(direction)
    @tile(x,y).direction = str_to_dir(direction)
    if (pusher_type == 'even')
      @tile(x,y).pusher_type = 0
    else
      @tile(x,y).pusher_type = 1
    @addWall(x,y,opp_dir[direction])

  addStart: (x,y,direction) ->
    console.log("Start #{x},#{y},#{direction}")
    @start_tiles.push( {x:Number(@col(x,y)), y:Number(@row(x,y)), direction:direction} )
    @tile(x,y).start = true

  addCheckpoint: (x,y) ->
    cnt = @checkpoints.length
    if cnt > 0
      last_cp = @checkpoints[cnt-1]
      @tile(last_cp.x,last_cp.y).finish = false
  
    cnt += 1
    @checkpoints.push({x:x,y:y,number:cnt})
    @tile(x,y).checkpoint = cnt
    @tile(x,y).finish = true
    @tile(x,y).repair = true
    console.log("Checkpoint #{cnt} located at #{x},#{y}")
  
  addWall: (x,y,direction) ->
    if @tile(x,y).wall
      @tile(x,y).wall += '-' + direction
    else
      @tile(x,y).wall = direction
    
    for d in direction.split('-')
      @tile(x,y).addItem('wall', str_to_dir(d))

  addDoubleLaser: (startX, startY, direction, length) ->
    @addLaser(startX, startY, direction, length, 2)

  addLaser: (x, y, direction, length, strength=1) ->
    laser_type = switch strength
      when 3 then 'triplelaser'
      when 2 then 'doublelaser'
      else 'laser'
    
    for i in [1..length]
      @tile(x,y).damage = strength
      @tile(x,y).addItem(laser_type, str_to_dir(direction))
      if i == 1  # lasers are always between walls
        @addWall(x,y,long_dir[opp_dir[direction]])
      else if i == length
        @addWall(x,y,long_dir[direction])
      
      y = nextY(y,direction)
      x = nextX(x,direction)

  

  

  setType: (x,y,type) ->
    @tile(x,y).type = type
    @tile(x,y).description = switch type
      when Tiles.ROLLER
        "This is a converyor belt. You will move 1 space in the direction of the arrow when ending here after a card has been played."
      when Tiles.VOID
        "Don't fall in this giant hole in the ground or you'll die."
      when Tiles.EMPTY
        if (@tile(x,y).wall)
          "Even awesome robots can't pass through these massive walls."

  setRollerTileProp: (x,y, roller_type, direction, speed) ->
    @tile(x,y).direction = str_to_dir(direction)
    @tile(x,y).move = step(direction)
    @tile(x,y).speed = speed

    if @tile(x,y).type == Tiles.ROLLER && @tile(x,y).roller_type != roller_type
      t = @tile(x,y).roller_type.split('-')
      t.push(roller_type)
      roller_type = t.sort().join('-')
    
    if (speed == 2) && !(RegExp('express').test(roller_type))
      roller_type = 'express-' + roller_type
    
    @tile(x,y).roller_type = roller_type
    @setType(x,y,Tiles.ROLLER)


  # helper methods

  create2DArray = (rows) ->
    arr = []
    for i in [0..rows-1]
      arr[i] = []
    return arr

  stepX = (direction) ->
    if (direction == 'l' || direction == 'left')
      return -1
    else if (direction =='r' || direction == 'right')
      return 1
    else
      return 0

  stepY = (direction) ->
    if (direction == 'u' || direction == 'up')
      return -1
    else if (direction == 'd' || direction == 'down')
      return 1
    else
      return 0

  step = (dir) ->
    {x: stepX(dir), y: stepY(dir)}

  nextX = (x, direction) ->
    x + stepX(direction)

  nextY = (y, direction) ->
    y + stepY(direction)

  style_direction = (direction) ->
    "transform: rotate(#{90*direction}deg);"

  str_to_dir = (str) ->
    GameLogic[long_dir[str].toUpperCase()]

  long_dir = {r:'right',     l:'left',   u:'up', d:'down', \
              right:'right', left:'left',up:'up',down:'down'  }

  opp_dir  = {r:'l',        l:'r',        u:'d',     d:'u', \
              right:'left', left:'right', up:'down', down:'up'}


  class Item
    constructor: (type, direction) ->
      @style = style_direction(direction)
      @path = "/tiles/"+ type + ".png"
      @description = switch type
        when 'wall'
          "Even awesome robots can't pass through these massive walls."
        when 'laser'
          "This is a laser. You will gain one damage."
        else ''

  class Tile
    constructor: (tile_type=Tiles.EMPTY) ->
      @type = tile_type
      @wall = false
      @items = []
      @damage = 0
      @direction = GameLogic.UP
      @roller_type = ''

    orientation_css: () =>
      return style_direction(@direction)

    path: () ->
      p = "/tiles/#{@type}"
      p += switch @type
        when 'empty'  then "-1"
        when 'gear'   then "-#{@gear_type}"
        when 'pusher' then @pusher_type == 0 ? '-even' : '-odd'
        when 'roller' then "-#{@roller_type}"
        when 'void'   then '-square'
        else ''
      p += '.jpg'
      return p

    addItem: (type, direction) ->
      @items.push(new Item(type,direction-@direction))  # the items are inside of the tile span so the
                                                        # direction has to be relative to the tile orientation


