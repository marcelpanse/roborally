class @BoardBox
  CATALOG = [ 'default', 'vault', 'moving_targets', 'checkmate', 'bloodbath_chess', 'whirlwind_tour' ],

  _cache = []

  getBoard = (boardId) ->
    if !boardId? || boardId < 0 || boardId > BoardBox.CATALOG.length
      boardId = 0
    if !_cache[boardId]?
      board_name = BoardBox.CATALOG[boardId]
      console.log("Load "+board_name+" board")
      _cache[boardId] = BoardBox.boards[board_name]()
  
    _cache[boardId]

  getBoardId = (name) ->
    return BoardBox.CATALOG.indexOf(name)

  boards: {
    default: function() {
      var board = new Board(1);
      board.name = 'default';
      board.title = 'Default';
      board.length = 'short';
      board.addRallyArea('default');
      board.addStartArea('simple');
      board.addCheckpoint(7, 3);
      board.addCheckpoint(1, 8);
      board.addCheckpoint(7, 7);
      return board;
    },
    vault: function() {
      var board = new Board(2,8);
      board.name = 'vault';
      board.title = 'Option World';
      board.length = 'medium';
      board.addRallyArea('vault');
      board.addStartArea('roller');
      board.addCheckpoint(3, 5);
      board.addCheckpoint(9, 1);
      board.addCheckpoint(5, 8);
      board.addCheckpoint(2, 0);
      return board;
    },
    moving_targets: function() {
      var board = new Board(2,8);
      board.name = 'moving_targets';
      board.title = 'Moving Targets';
      board.length = 'medium';
      board.addRallyArea('maelstrom');
      board.addStartArea('simple');
      board.addCheckpoint(1,0);
      board.addCheckpoint(10,11);
      board.addCheckpoint(11,5);
      board.addCheckpoint(0,6);
      return board;
    },
    checkmate: function() {
      var board = new Board(5,8);
      board.name = 'checkmate';
      board.title = 'Checkmate';
      board.length = 'short';
      board.addRallyArea('chess');
      board.addStartArea('simple');
      board.addCheckpoint(7,2);
      board.addCheckpoint(3,8);
      return board;
    },
    bloodbath_chess: function() {
      var board = new Board(2,4);
      board.name = 'bloodbath_chess';
      board.title = 'Bloodbath Chess';
      board.length = 'medium';
      board.addRallyArea('chess');
      board.addStartArea('simple');
      board.addCheckpoint(6,5);
      board.addCheckpoint(2,9);
      board.addCheckpoint(8,7);
      board.addCheckpoint(3,4);
      return board;
    },
    whirlwind_tour: function() {
      var board = new Board(5,8);
      board.name = 'whirlwind_tour';
      board.title = 'Whirlwind Tour';
      board.length = 'medium';
      board.addRallyArea('maelstrom');
      board.addStartArea('simple');
      board.addCheckpoint(8,0);
      board.addCheckpoint(3,11);
      board.addCheckpoint(11,6);
      return board;
    }

  }
};
