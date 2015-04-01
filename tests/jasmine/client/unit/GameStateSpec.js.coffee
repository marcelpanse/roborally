# Test Board
#          0                1             2              3
#                        ------------                ----------
#  0      Finish         PushDownEven  PushUpOdd     Checkpoint
#                                      ------------
#  1    |===Option===|   Void          Repair        ExpressLeft
#                        -----------
#  2      RollerRight      |        |  ExpressRight  ExpressUp
#                          |
#  3      RollerUp         | GearCw    GearCcw       ExpressUp
#                        -----------
#  4      Start          Start         Start         Start



describe 'GameState', ->
  describe 'PLAY_PHASE', ->
    describe 'MOVE_BOARD', ->
      it 'moves players on rollers', ->
        players = phase_with_players_at(GameState.PLAY_PHASE.MOVE_BOARD,3,2)
        GameState.nextPlayPhase(players[0].gameId)
        Meteor.setTimeout ->
          expect(players[0]).toBeAt(0,2)
        , 600
      it 'moves players on rollers even when get shot', ->
        players = phase_with_players_at(GameState.PLAY_PHASE.MOVE_BOARD,3,2,3,4)
        GameState.nextPlayPhase(players[0].gameId)
        Meteor.setTimeout ->
          expect(players[0]).toBeAt(0,2)
          expect(players[0].damage).toEqual(1)
        , 800
      it "doesn't get shot at old position", ->
        players = phase_with_players(GameState.PLAY_PHASE.MOVE_BOARD,3,3,UP,2,3,DOWN)
        GameState.nextPlayPhase(players[0].gameId)
        Meteor.setTimeout ->
          expect(players[0]).toBeAt(0,2)
          expect(players[0].damage).toEqual(0)
        , 600
      it "doesn't get shot at old position", ->
        players = phase_with_players(GameState.PLAY_PHASE.MOVE_BOARD,3,3,UP,2,3,RIGHT)
        GameState.nextPlayPhase(players[0].gameId)
        Meteor.setTimeout ->
          expect(players[0]).toBeAt(0,2)
          expect(players[0].damage).toEqual(0)
        , 600
      it "gets shot at new position", ->
        players = phase_with_players(GameState.PLAY_PHASE.MOVE_BOARD,3,3,UP,2,1,RIGHT)
        GameState.nextPlayPhase(players[0].gameId)
        Meteor.setTimeout ->
          expect(players[0]).toBeAt(0,2)
          expect(players[0].damage).toEqual(1)
        , 600

