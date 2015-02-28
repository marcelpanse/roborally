
class @Tile
  EMPTY:  "empty"
  VOID:   "void"
  ROLLER: "roller"
  PUSHER: "pusher"
  GEAR:   "gear"
  REPAIR: "repair"
  OPTION: "option"
  
  constructor: (tile_type=Tile.EMPTY) ->
    @type = tile_type
    @wall = false
    @items = []
    @damage = 0
    @rotate = 0
    @move = {x:0, y:0}
    @direction = GameLogic.UP
    @roller_type = ''

  orientation_css: () =>
    return style_direction(@direction)


  hasWall: (direction) ->
    @wall && @wall[direction]

  setType: (type) ->
    @type = type
    @description = switch type
      when Tile.ROLLER
        "This is a converyor belt. \
         You will move 1 space in the direction of the arrow \
         when ending here after a card has been played."
      when Tile.VOID
        "Don't fall in this giant hole in the ground or you'll die."
      when Tile.EMPTY
        if (@wall)
          "Even awesome robots can't pass through these massive walls."

  path: () ->
    p = "/tiles/#{@type}"
    p += switch @type
      when 'empty'  then "-1"
      when 'gear'   then "-#{@gear_type}"
      when 'pusher'
        if @pusher_type == 0
          '-even'
        else
          '-odd'
      when 'roller'
        if @speed == 2
          "-express-#{@roller_type}"
        else
          "-#{@roller_type}"
      when 'void'   then '-square'
      else ''
    p += '.jpg'
    return p

  addWall: (direction) ->
    if @wall
      @wall[direction] = true
    else
      @wall = {}
      @wall[direction] = true

    @addItem('wall', direction)

  addCheckpoint: (number) ->
    @checkpoint = cnt
    @finish = true
    @repair = true

  addStart: (number) ->
    @start = number

  addLaser: (direction, strength) ->
    laser_type = switch strength
      when 3 then 'triplelaser'
      when 2 then 'doublelaser'
      else 'laser'
    @damage = strength
    addItem(laser_type, direction)

  addItem: (type, direction) ->
    # the items are inside of the tile span so the
    # direction has to be relative to the tile orientation
    @items.push(new Item(type,direction-@direction))

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