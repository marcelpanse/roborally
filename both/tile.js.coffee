
class @Tile
  @EMPTY:  "empty"
  @VOID:   "void"
  @ROLLER: "roller"
  @PUSHER: "pusher"
  @GEAR:   "gear"
  @REPAIR: "repair"
  @OPTION: "option"
  @LIMBO:  "limbo"  # off the board

  constructor: (tile_type=Tile.EMPTY) ->
    @type = tile_type
    @wall = false
    @void_neighbour = [false, false, false, false]
    @items = []
    @damage = 0
    @rotate = 0
    @move = {x:0, y:0}
    @direction = GameLogic.UP
    @roller_type = ''
    @void_type = ''

  hasWall: (direction) ->
    @wall && @wall[direction]

  setType: (type) ->
    @type = type
    @description = switch type
      when Tile.ROLLER
        if @speed == 2
          "This is an express converyor belt. \
           You will move 2 spaces in the direction of the arrow \
           when ending here after a card has been played."
        else
          "This is a converyor belt. \
           You will move 1 space in the direction of the arrow \
           when ending here after a card has been played."
      when Tile.VOID
        "Don't fall in this giant hole in the ground or you'll die."
      when Tile.REPAIR, Tile.OPTION
        "If you end your hand on a repair site, one damage will be repaired."
      when Tile.GEAR
        msg = "This gear will turn you "
        msg += if @gear_type is "cw" then "right" else "left"
        msg += " when ending here after a card has been played."
      when Tile.PUSHER
        msg = "This pusher will push you 1 space away from it, but only after card "
        msg += if @pusher_type == 0 then "2 or 4" else "1, 3 or 5"

  path: () ->
    p = "/tiles/#{@type}"
    p += switch @type
      when 'gear' then "-#{@gear_type}"
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
      when 'void' then @void_type
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
    @checkpoint = number
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
    @addItem(laser_type, direction)

  addItem: (type, direction) ->
    # the items are inside of the tile span so the
    # direction has to be relative to the tile orientation
    @items.push(new Item(type,direction-@direction))

  updateVoidType: (void_dir) ->
    @void_neighbour[void_dir] = true

    # to figure out void type rotate such that
    #  - there is an UP void neighbour (if there is at least one void neighbour)
    #  - there is a LEFT non-void neighbour (if there is at least one non-void neighbour)
    no_void = @void_neighbour.indexOf(false)
    @direction = @void_neighbour.indexOf(true, no_void)
    @direction = 0 if @direction == -1
    @void_type = ''
    for i in [0..3]
      if @void_neighbour[(i+@direction)%4]
        @void_type += "-" + to_word(i)


  to_word = (dir) ->
    dir_words[dir]

  dir_words = ['up', 'right', 'down', 'left']


class Item
  constructor: (type, direction) ->
    @direction = direction
    @path = "/tiles/"+ type + ".png"
    @description = switch type
      when 'wall'
        "Even awesome robots can't pass through these massive walls."
      when 'laser'
        "This is a laser! It hurts and you will gain one damage."
      when 'doublelaser'
        "This is a double laser!! It hurts a lot and you will gain two damages."
      when 'triplelaser'
        "This is a triple laser!!! It hurts like hell and you will gain three damages."
      else false
