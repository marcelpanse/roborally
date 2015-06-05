
class @Board
  constructor: (name, min_player=2, max_player=8, width=12, height=16) ->
    @name = name
    @title = toTitleCase(name)
    @tiles = create2DArray(height)
    @startpoints=[]
    @checkpoints=[]
    @min_player = min_player
    @max_player = max_player
    @height = height
    @width = width

    for y in [0..@height-1]
      for x in [0..@width-1]
        @tiles[y][x] = new Tile

  getTile: (x,y) ->
    if !@onBoard(x,y)
      console.log "Invalid board tile (#{x},#{y})"
      return new Tile(Tile.LIMBO)
    @tiles[y][x]

  onBoard: (x,y) ->
    x >= 0 && y >= 0 && x < @width && y < @height

  canMove: (x, y, direction) ->
    dir = to_dir(direction)
    tile = @getTile(x, y)
    step = to_step direction
    targetTile = @getTile(x+step.x, y+step.y)
    targetTileDir = opp_dir(dir)

    return !tile.hasWall(dir) && !targetTile.hasWall(targetTileDir)


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

    build_area.call(@)

    @x_offset = 0
    @y_offset = 0
    @orientation = 0

  addCheckpoint: (x,y) ->
    cnt = @checkpoints.length
    if cnt > 0
      last_cp = @checkpoints[cnt-1]
      @tile(last_cp.x,last_cp.y).finish = false

    cnt += 1
    @checkpoints.push({x:x,y:y,number:cnt})
    @tile(x,y).addCheckpoint(cnt)
    console.log("Checkpoint #{cnt} located at #{x},#{y}")

  @to_dir: (val) ->
    switch typeof val
      when 'object'
        if val.x > 0
          GameLogic.RIGHT
        else if val.x < 0
          GameLogic.LEFT
        else if val.y > 0
          GameLogic.DOWN
        else if val.y < 0
          GameLogic.UP
      when 'number'
        if val < 0 || val > 3
          val % 4
        else
          val
      when 'string'
        GameLogic[long_dir[val].toUpperCase()]

  @to_step: (dir) ->
    step = {x:0, y:0}
    switch @to_dir(dir)
      when GameLogic.UP
        step.y = -1
      when GameLogic.RIGHT
        step.x = 1
      when GameLogic.DOWN
        step.y = 1
      when GameLogic.LEFT
        step.x = -1
    return step

  #~~~~~~~~~ methods used in area.js.coffee to construct board areas

  tile: (x,y) ->
    @tiles[@row(x,y)][@col(x,y)]

  absolute_dir: (direction) ->
    (to_dir(direction) + (@orientation/90)) % 4

  col: (x,y) ->
    res = switch @orientation
      when 0 then x
      when 90 then @area_height-1-y
      when 180 then @area_width-1-x
      when 270 then y
    res + @x_offset

  row: (x,y) ->
    res = switch @orientation
      when 0 then y
      when 90 then x
      when 180 then @area_height-1-y
      when 270 then @area_width-1-x
    res + @y_offset

  setVoid: (x,y) ->
    @tile(x,y).setType Tile.VOID
    for i in [0..3]
      step = to_step(i)
      nx = x+step.x
      ny = y+step.y
      if @onBoard(@col(nx,ny), @row(nx,ny)) && @tile(nx, ny).type == Tile.VOID
        @tile(nx, ny).updateVoidType(@absolute_dir(opp_dir(i)))
        @tile(x,y).updateVoidType(@absolute_dir(i))

  setRoller: (x, y, route, speed=1) ->
    cur_dir = route.charAt(0)
    roller_type = 'straight'
    @setRollerTileProp(x, y, roller_type, cur_dir, speed)

    last_dir = cur_dir
    for cur_dir in route[1..-1]
      # not the curved conveyor belt but the previous one rotates the robot
      if last_dir != cur_dir
        rot = to_dir(cur_dir) - to_dir(last_dir)
        if (rot == -1 || rot == 3)
          @tile(x,y).rotate = -1
          roller_type = 'ccw'
        else
          @tile(x,y).rotate = 1
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
    @tile(x,y).setType Tile.REPAIR

  setOption: (x,y) ->
    @tile(x,y).repair
    @tile(x,y).repair = true
    @tile(x,y).option = true
    @tile(x,y).setType Tile.OPTION

  setGear: (x,y,gear_type) ->
    @tile(x,y).gear_type = gear_type
    if (gear_type == 'cw')
      @tile(x,y).rotate = 1
    else
      @tile(x,y).rotate = -1
    @tile(x,y).setType Tile.GEAR

  setPusher: (x,y, direction, pusher_type) ->
    dir = @absolute_dir(direction)
    if (pusher_type == 'even')
      @tile(x,y).pusher_type = 0
    else
      @tile(x,y).pusher_type = 1
    @tile(x,y).setType Tile.PUSHER
    @tile(x,y).move = to_step(dir)
    @tile(x,y).direction = dir
    @tile(x,y).addWall opp_dir(dir)

  addWall: (x,y,direction) ->
    for d in direction.split('-')
      @tile(x,y).addWall @absolute_dir(d)

  addDoubleLaser: (startX, startY, direction, length) ->
    @addLaser(startX, startY, direction, length, 2)

  addLaser: (x, y, direction, length, strength=1) ->
    dir = @absolute_dir(direction)

    for i in [1..length]
      @tile(x,y).addLaser dir, strength
      if i == 1  # lasers are always between walls
        @tile(x,y).addWall opp_dir(dir)
      if i == length
        @tile(x,y).addWall dir

      y = nextY(y,direction)
      x = nextX(x,direction)

  addStart: (x,y,direction) ->
    console.log("Start #{x},#{y},#{direction}")
    @startpoints.push
      x: Number(@col(x,y)),
      y: Number(@row(x,y)),
      direction: @absolute_dir(direction)

    @tile(x,y).addStart(@startpoints.length)

  #~~~~~~ helper methods

  setRollerTileProp: (x,y, roller_type, direction, speed) ->
    dir = @absolute_dir(direction)
    @tile(x,y).direction = dir
    @tile(x,y).move      = to_step(dir)
    @tile(x,y).speed     = speed

    if @tile(x,y).type == Tile.ROLLER && @tile(x,y).roller_type != roller_type
      t = @tile(x,y).roller_type.split('-')
      t.push(roller_type)
      roller_type = t.sort().join('-')

    @tile(x,y).roller_type = roller_type
    @tile(x,y).setType Tile.ROLLER


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

  nextX = (x, direction) ->
    x + stepX(direction)

  nextY = (y, direction) ->
    y + stepY(direction)

  to_dir = (val) ->
    Board.to_dir(val)

  to_step = (dir) ->
    Board.to_step(dir)

  opp_dir = (dir) ->
    switch typeof dir
      when 'number'
        (dir+2) % 4
      when 'string'
        opp_word[dir]
      when 'object'
        {x: -dir.x, y: -dir.y}

  toTitleCase = (str) ->
    str.replace(/_/g,' ').replace /\w\S*/g, (txt) ->
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()


  long_dir = {r:'right',     l:'left',   u:'up', d:'down', \
              right:'right', left:'left',up:'up',down:'down'  }

  opp_word  = {r:'l',        l:'r',        u:'d',     d:'u', \
              right:'left', left:'right', up:'down', down:'up'}
