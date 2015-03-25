LEFT  = GameLogic.LEFT
RIGHT = GameLogic.RIGHT
UP    = GameLogic.UP
DOWN  = GameLogic.DOWN

phase_with_players = (phase, x1, y1, dir1=UP, x2=-1,y2=-1,dir2=UP, x3=-1,y3=-1,dir3=UP) ->
  game =
    name: "test",
    submitted: new Date().getTime(),
    started: true,
    gamePhase: GameState.PLAY,
    playPhase: phase,
    playPhaseCount: 1,
    boardId: BoardBox.test_board_id,
    waitingForRespawn: []
  
  gameId = Games.insert(game)
  add_player(gameId, x1, y1, dir1)
  if x2 >= 0
    add_player(gameId, x2, y2, dir2)
  if x3 >= 0
    add_player(gameId, x3, y3, dir3)
  Players.find({gameId: gameId}).fetch()

phase_with_players_at = (phase, x1, y1, x2=-1,y2=-1,x3=-1,y3=-1) ->
  phase_with_players(phase,x1,y1,UP,x2,y2,UP,x3,y3,UP)
players_facing = (x1, y1, dir1=UP, x2=-1,y2=-1,dir2=UP, x3=-1,y3=-1,dir3=UP)->
  phase_with_players(GameState.PLAY_PHASE.IDLE,x1,y1,dir1,x2,y2,dir2,x3,y3,dir3)
players_at = (x1, y1, x2=-1,y2=-1, x3=-1,y3=-1) ->
  players_facing(x1,y1,UP,x2,y2,UP,x3,y3,UP)

add_player = (gameId, x, y, dir=GameLogic.UP) ->
  Players.insert
    gameId: gameId,
    name: 'player',
    lives: 3,
    damage: 0,
    visited_checkpoints: 0,
    needsRespawn: false,
    position: {x: x, y: y},
    direction: dir,
    cards: []

beforeEach ->
  jasmine.addMatchers
    toBeAt: ->
      compare: (actual, expectedX, expectedY) ->
        player = actual
        pass: player.position.x == expectedX && player.position.y == expectedY
    toFace: () ->
      compare: (actual, expectedDir) ->
        player = actual
        pass: player.direction == expectedDir
  



