class @BoardBox
  @CATALOG = [ 'default', 'checkmate', 'bloodbath_chess', 'whirlwind_tour',
               'option_world', 'oddest_sea', 'dizzy_dash', 'twister' ]
               #moving_targets'

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
    if name == 'test'
      @test_board_id
    else
      @CATALOG.indexOf(name)

  @getTestBoard: ->
    if !@cache[@test_board_id]?
      @cache[@test_board_id] = @boards.test()
    @cache[@test_board_id]

  @boards:
    default: () ->
      board = new Board(1)
      board.name = 'default'
      board.title = 'Default'
      board.length = 'short'
      board.addRallyArea('default')
      board.addStartArea('simple')
      board.addCheckpoint(7, 3)
      board.addCheckpoint(1, 8)
      board.addCheckpoint(7, 7)
      return board
    test: () ->
      board = new Board(1,4,4,5)
      board.name = 'test'
      board.title = "Test Board"
      board.addRallyArea('test')
      board.addStartArea('test',0,4)
      board.addCheckpoint(3,0)
      board.addCheckpoint(0,0)
      return board
    option_world: () ->
      board = new Board(2,8)
      board.name = 'option_world'
      board.title = 'Option World'
      board.length = 'medium'
      board.addRallyArea('vault')
      board.addStartArea('roller')
      board.addCheckpoint(3, 5)
      board.addCheckpoint(9, 1)
      board.addCheckpoint(5, 8)
      board.addCheckpoint(2, 0)
      return board
    moving_targets: () ->
      board = new Board(2,8)
      board.name = 'moving_targets'
      board.title = 'Moving Targets'
      board.length = 'medium'
      board.addRallyArea('maelstrom')
      board.addStartArea('simple')
      board.addCheckpoint(1,0)
      board.addCheckpoint(10,11)
      board.addCheckpoint(11,5)
      board.addCheckpoint(0,6)
      return board
    checkmate: () ->
      board = new Board(5,8)
      board.name = 'checkmate'
      board.title = 'Checkmate'
      board.length = 'short'
      board.addRallyArea('chess')
      board.addStartArea('simple')
      board.addCheckpoint(7,2)
      board.addCheckpoint(3,8)
      return board
    bloodbath_chess: () ->
      board = new Board(2,4)
      board.name = 'bloodbath_chess'
      board.title = 'Bloodbath Chess'
      board.length = 'medium'
      board.addRallyArea('chess')
      board.addStartArea('simple')
      board.addCheckpoint(6,5)
      board.addCheckpoint(2,9)
      board.addCheckpoint(8,7)
      board.addCheckpoint(3,4)
      return board
    whirlwind_tour: () ->
      board = new Board(5,8)
      board.name = 'whirlwind_tour'
      board.title = 'Whirlwind Tour'
      board.length = 'medium'
      board.addRallyArea('maelstrom')
      board.addStartArea('simple')
      board.addCheckpoint(8,0)
      board.addCheckpoint(3,11)
      board.addCheckpoint(11,6)
      return board
    oddest_sea: () ->
      board = new Board(5,8,12,28)
      board.name = 'oddest_sea'
      board.title = 'Oddest Sea'
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
      board = new Board(2,8)
      board.name = 'dizzy_dash'
      board.title = 'Dizzy Dash'
      board.length = 'short'
      board.addRallyArea('spin_zone')
      board.addStartArea('roller')
      board.addCheckpoint 5,4
      board.addCheckpoint 10,11
      board.addCheckpoint 1,6
      return board
    twister: () ->
      board = new Board(5,8)
      board.name = 'twister'
      board.title = 'Twister'
      board.length = 'medium'
      board.addRallyArea('spin_zone')
      board.addStartArea('roller')
      board.addCheckpoint 2,9
      board.addCheckpoint 3,2
      board.addCheckpoint 9,2
      board.addCheckpoint 8,9
      return board


