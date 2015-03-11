# Test Board
#          0                1             2              3
#                                                    ----------
#  0      Finish         PushDownEven  PushUpOdd     Checkpoint
#
#  1    |===Option===|   Void          Repair        ExpressLeft
#                        -----------
#  2      RollerRight      |           ExpressRight  ExpressUp
#                          |
#  3      RollerUp         | GearCw    GearCcw       ExpressUp
#                        -----------
#  4      Start          Start         Start         Start



tile = (x,y) ->
  BoardBox.getTestBoard().getTile(x,y)

rollerUp    = tile(0,3)
rollerRight = tile(0,2)
expressUp   = tile(3,2)
expressLeft = tile(3,1)
doubleLaser = tile(0,1)
gearCw      = tile(1,3)
gearCcw     = tile(2,3)

describe 'Board', ->
  board = BoardBox.getTestBoard()

  it 'has name', ->
    expect(board.name).toEqual('test')

  describe 'Laser', ->
    it 'causes damage', ->
      expect(tile(1,3).damage).toEqual(1)
    it 'starts at a wall ', ->
      expect(tile(1,2).hasWall(GameLogic.UP)).toBeTruthy()
    it 'ends at a wall ', ->
      expect(tile(1,3).hasWall(GameLogic.DOWN)).toBeTruthy()

  describe 'DoubleLaser', ->
    it 'causes two damage', ->
      expect(doubleLaser.damage).toEqual(2)
    it 'starts at a wall ', ->
      expect(doubleLaser.hasWall(GameLogic.LEFT)).toBeTruthy()
    it 'ends at a wall ', ->
      expect(doubleLaser.hasWall(GameLogic.RIGHT)).toBeTruthy()

  describe 'Checkpoint', ->
    it 'has correct number', ->
      expect(tile(3,0).checkpoint).toEqual(1)
      expect(tile(3,0).finish).toBeFalsy()
    it 'last checkpoint is finish', ->
      expect(tile(0,0).checkpoint).toEqual(2)
      expect(tile(0,0).finish).toBeTruthy()

  describe 'Roller', ->
    it 'has correct direction', ->
      expect(tile(0,3).direction).toEqual(GameLogic.UP)
      expect(tile(0,2).direction).toEqual(GameLogic.RIGHT)
    it 'has correct rotation', ->
      expect(tile(0,3).rotate).toEqual(1)
      expect(tile(0,2).rotate).toEqual(0)
    it 'has speed 1', ->
      expect(tile(0,3).speed).toEqual(1)
      expect(tile(0,2).speed).toEqual(1)

  describe 'ExpressRoller', ->
    it 'has correct direction', ->
      expect(expressUp.type).toEqual(Tile.ROLLER)
      expect(expressUp.direction).toEqual(GameLogic.UP)
      expect(expressLeft.direction).toEqual(GameLogic.LEFT)
    it 'has speed 2', ->
      expect(expressUp.speed).toEqual(2)
      expect(expressLeft.speed).toEqual(2)
    describe 'before a turn', ->
      it 'rotates', ->
        expect(expressUp.rotate).toEqual(-1)
    describe 'turn', ->
      it 'does not rotate', ->
        expect(expressLeft.rotate).toEqual(0)

  describe 'Gear', ->
    describe 'clockwise', ->
      it 'rotates', ->
        expect(gearCw.rotate).toEqual(1)
      it 'has no direction', ->
        expect(gearCw.direction).toBeFalsy()

    describe 'counterclockwise', ->
      it 'rotates', ->
        expect(gearCcw.rotate).toEqual(-1)
      it 'has no direction', ->
        expect(gearCcw.direction).toBeFalsy()


  describe 'canMove', ->
    it 'false if wall in direction', ->
      expect(board.canMove(1,2,GameLogic.RIGHT)).toBeFalsy()
    it 'false if wall in opposite direction', ->
      expect(board.canMove(2,2,GameLogic.LEFT)).toBeFalsy()
    it 'true for move off board', ->
      expect(board.canMove(0,0,GameLogic.UP)).toBeTruthy()
    it 'true for move on void', ->
      expect(board.canMove(1,0,GameLogic.DOWN)).toBeTruthy()
  describe 'onBoard', ->
    it 'true on board', ->
      expect(board.onBoard(1,1)).toBeTruthy()
    it 'false off board', ->
      expect(board.onBoard(-1,0)).toBeFalsy()








