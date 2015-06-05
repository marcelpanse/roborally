class @BoardBox
  @CATALOG = [ 'default', 
               # beginner courses
               'risky_exchange', 'checkmate', 'dizzy_dash',
               'island_hop', 'chop_shop_challenge', 'twister', 'bloodbath_chess',
               'around_the_world', 'death_trap', 'pilgrimage',
               # expert courses
               'vault_assault', 'whirlwind_tour', 'lost_bearings', 'robot_stew',
               'oddest_sea', 'against_the_grain', 'island_king', 
               # with special rules
               'tricksy', #moving_targets',
               'set_to_kill', 'factory_rejects', 'option_world', 'tight_collar', 
               'ball_lightning',  'flag_fry', 'crowd_chess' 
             ]
               
  @BEGINNER_COURSE_CNT = 11
  @cache = []
  @test_board_id = @CATALOG.length

  @getBoard: (boardId) ->
    if !boardId? || boardId < 0 || boardId >= @CATALOG.length
      if boardId == @test_board_id
        return @getTestBoard()
      else
        boardId = 0
    if !@cache[boardId]?
      board_name = @CATALOG[boardId]
      console.log("Load #{board_name} board")
      @cache[boardId] = @boards[board_name]()

    @cache[boardId]

  @getBoardId: (name) ->
    if name == 'test-mode'
      @test_board_id
    else
      @CATALOG.indexOf(name)

  @getTestBoard: ->
    if !@cache[@test_board_id]?
      @cache[@test_board_id] = @boards.test()
    @cache[@test_board_id]

  @boards:
    default: () ->
      board = new Board('default',1)
      board.length = 'short'
      board.addRallyArea('cross')
      board.addStartArea('simple')
      board.addCheckpoint(7, 3)
      board.addCheckpoint(1, 8)
      board.addCheckpoint(7, 7)
      return board
    test: () ->
      board = new Board('test',1,4,4,5)
      board.addRallyArea('test')
      board.addStartArea('test',0,4)
      board.addCheckpoint(3,0)
      board.addCheckpoint(0,0)
      return board
    option_world: () ->
      board = new Board('option_world',2,8)
      board.length = 'medium'
      board.addRallyArea('vault')
      board.addStartArea('roller')
      board.addCheckpoint(3, 5)
      board.addCheckpoint(9, 1)
      board.addCheckpoint(5, 8)
      board.addCheckpoint(2, 0)
      return board
    moving_targets: () ->
      board = new Board('moving_targets',2,8)
      board.length = 'medium'
      board.addRallyArea('maelstrom')
      board.addStartArea('simple')
      board.addCheckpoint(1,0)
      board.addCheckpoint(10,11)
      board.addCheckpoint(11,5)
      board.addCheckpoint(0,6)
      return board
    checkmate: () ->
      board = new Board('checkmate',5,8)
      board.length = 'short'
      board.addRallyArea('chess')
      board.addStartArea('simple')
      board.addCheckpoint(7,2)
      board.addCheckpoint(3,8)
      return board
    bloodbath_chess: () ->
      board = new Board('bloodbath_chess',2,4)
      board.length = 'medium'
      board.addRallyArea('chess')
      board.addStartArea('simple')
      board.addCheckpoint(6,5)
      board.addCheckpoint(2,9)
      board.addCheckpoint(8,7)
      board.addCheckpoint(3,4)
      return board
    whirlwind_tour: () ->
      board = new Board('whirlwind_tour',5,8)
      board.length = 'medium'
      board.addRallyArea('maelstrom')
      board.addStartArea('simple')
      board.addCheckpoint(8,0)
      board.addCheckpoint(3,11)
      board.addCheckpoint(11,6)
      return board
    oddest_sea: () ->
      board = new Board('oddest_sea',5,8,12,28)
      board.length = 'long'
      board.addRallyArea('vault',0,0,180)
      board.addRallyArea('maelstrom',0,12)
      board.addStartArea('simple',0,24)
      board.addCheckpoint(8,6)
      board.addCheckpoint(1,4)
      board.addCheckpoint(5,8)
      board.addCheckpoint(9,2)
      return board
    dizzy_dash: () ->
      board = new Board('dizzy_dash',2,8)
      board.length = 'short'
      board.addRallyArea('spin_zone')
      board.addStartArea('roller')
      board.addCheckpoint 5,4
      board.addCheckpoint 10,11
      board.addCheckpoint 1,6
      return board
    twister: () ->
      board = new Board('twister',5,8)
      board.length = 'medium'
      board.addRallyArea('spin_zone')
      board.addStartArea('roller')
      board.addCheckpoint 2,9
      board.addCheckpoint 3,2
      board.addCheckpoint 9,2
      board.addCheckpoint 8,9
      return board
    island_hop: () ->
      board = new Board('island_hop',2,8)
      board.length = 'medium'
      board.addRallyArea('island')
      board.addStartArea('simple')
      board.addCheckpoint 6,1
      board.addCheckpoint 1,6
      board.addCheckpoint 11,4
      return board
    death_trap: () ->
      board = new Board('death_trap',2,4)
      board.length = 'short'
      board.addRallyArea('island')
      board.addStartArea('simple')
      board.addCheckpoint 7,7
      board.addCheckpoint 0,4
      board.addCheckpoint 6,5
      return board
    around_the_world: () ->
      board = new Board('around_the_world',5,8,12,28)
      board.length = 'long'
      board.addRallyArea('island',0,0,180)
      board.addRallyArea('spin_zone',0,12,90)
      board.addStartArea('simple',0,24)
      board.addCheckpoint 9,12
      board.addCheckpoint 6,1
      board.addCheckpoint 5,22
      return board
    island_king: () ->
      board = new Board('island_king',2,8)
      board.length = 'short'
      board.addRallyArea('island',0,0,180)
      board.addStartArea('simple')
      board.addCheckpoint 5,4
      board.addCheckpoint 7,7
      board.addCheckpoint 5,6
      return board
    risky_exchange: () ->
      board = new Board('risky_exchange',2,8)
      board.length = 'medium'
      board.addRallyArea 'exchange'
      board.addStartArea 'roller'
      board.addCheckpoint 7,1
      board.addCheckpoint 9,7
      board.addCheckpoint 1,4
      return board
    chop_shop_challenge: () ->
      board = new Board('chop_shop_challenge',2,4)
      board.length = 'medium'
      board.addRallyArea('chop_shop',0,0,180)
      board.addStartArea('simple')
      board.addCheckpoint(4,9)
      board.addCheckpoint(9,11)
      board.addCheckpoint(1,10)
      board.addCheckpoint(11,7)
      return board
    pilgrimage: () ->
      board = new Board('pilgrimage',2,8,12,28)
      board.length = 'long'
      board.addRallyArea 'cross'
      board.addRallyArea 'exchange',0,12,180
      board.addStartArea 'simple',0,24
      board.addCheckpoint 4,8
      board.addCheckpoint 9,19
      board.addCheckpoint 2,14
      return board
    crowd_chess: () ->
      board = new Board('crowd_chess',8,12)
      board.length = 'short'
      board.addRallyArea('crowd_chess')
      board.addStartArea('crowd')
      board.addCheckpoint(8,3)
      board.addCheckpoint(3,8)
      return board
    robot_stew: () ->
      board = new Board('robot_stew',2,4)
      board.length = 'medium'
      board.addRallyArea('chop_shop')
      board.addStartArea('roller')
      board.addCheckpoint(0,4)
      board.addCheckpoint(9,7)
      board.addCheckpoint(2,10)
      return board
    vault_assault: () ->
      board = new Board('vault_assault',2,4)
      board.length = 'short'
      board.addRallyArea('vault',0,0,270)
      board.addStartArea('roller')
      board.addCheckpoint(6,3)
      board.addCheckpoint(4,11)
      board.addCheckpoint(8,5)
      return board
    lost_bearings: () ->
      board = new Board('lost_bearings',2,4)
      board.length = 'medium'
      board.addRallyArea 'cross',0,0,180
      board.addStartArea 'simple'
      board.addCheckpoint 1,2
      board.addCheckpoint 10,9
      board.addCheckpoint 2,8
      return board
    against_the_grain: () ->
      board = new Board('against_the_grain',2,4,12,28)
      board.length = 'medium'
      board.addRallyArea 'chop_shop'
      board.addRallyArea 'chess',0,12,90
      board.addStartArea 'simple',0,24
      board.addCheckpoint 10,9
      board.addCheckpoint 3,3
      board.addCheckpoint 5,17
      return board
    tricksy: () ->
      board = new Board('tricksy',2,4)
      board.length = 'long'
      board.addRallyArea 'cross'
      board.addStartArea 'roller'
      board.addCheckpoint 9, 1
      board.addCheckpoint 0, 1
      board.addCheckpoint 8, 11
      board.addCheckpoint 3, 7
      return board
    set_to_kill: () ->
      board = new Board('set_to_kill',5,8)
      board.length = 'medium'
      board.addRallyArea 'exchange',0,0,180
      board.addStartArea 'roller'
      board.addCheckpoint 5,0
      board.addCheckpoint 2,11
      board.addCheckpoint 10,9
      board.addCheckpoint 2,4
      return board
    factory_rejects: () ->
      board = new Board('factory_rejects',5,8)
      board.length = 'short'
      board.addRallyArea 'chop_shop', 0,0,180
      board.addStartArea 'roller'
      board.addCheckpoint 7,1
      board.addCheckpoint 4,11
      board.addCheckpoint 2,4
      return board
    tight_collar: () ->
      board = new Board('tight_collar',2,8,12,28)
      board.length = 'medium'
      board.addRallyArea 'cross', 0,0,180
      board.addRallyArea 'chop_shop',0,12,90
      board.addStartArea 'simple',0,24
      board.addCheckpoint 4,2
      board.addCheckpoint 9,19
      return board
    ball_lightning: () ->
      board = new Board('ball_lightning',2,8,)
      board.length = 'short'
      board.addRallyArea 'spin_zone', 0,0,90
      board.addStartArea 'simple'
      board.addCheckpoint 7,5
      board.addCheckpoint 2,2
      board.addCheckpoint 5,9
      board.addCheckpoint 10,0
      return board
    flag_fry: () ->
      board = new Board('flag_fry',2,8)
      board.length = 'short'
      board.addRallyArea 'cross', 0,0, 180
      board.addStartArea 'simple'
      board.addCheckpoint 3,3
      board.addCheckpoint 9,3
      board.addCheckpoint 3,10
      return board



