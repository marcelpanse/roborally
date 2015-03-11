Meteor.methods({
  createGame: function(postAttributes) {
    var user = Meteor.user();

    // ensure the user is logged in
    if (!user)
      throw new Meteor.Error(401, "You need to login to create a game");
    if (!postAttributes.name || postAttributes.name === '') {
      throw new Meteor.Error(303, 'Name cannot be empty.');
    }
    var author = getUsername(user);
    // pick out the whitelisted keys

    var game = _.extend(_.pick(postAttributes, 'name'), {
      userId: user._id,
      author: author,
      submitted: new Date().getTime(),
      started: false,
      gamePhase: GameState.PHASE.IDLE,
      playPhase: GameState.PLAY_PHASE.IDLE,
      playPhaseCount: 0,
      boardId: 0
    });
    var board_id = BoardBox.getBoardId(game.name);
    if (board_id >= 0)
      game.boardId=board_id;

    game.min_player = BoardBox.getBoard(board_id).min_player;
    game.max_player = BoardBox.getBoard(board_id).max_player;
    var gameId = Games.insert(game);

    Chat.insert({
      gameId: gameId,
      message: 'Game created',
      submitted: new Date().getTime()
    });
    Meteor.call('joinGame', gameId, function(error) {
      if (error)
        return alert(error.reason);
    });

    return gameId;
  },

  joinGame: function(gameId) {
    var user = Meteor.user();

    if (!user)
      throw new Meteor.Error(401, "You need to login to join a game");
    var game = Games.findOne(gameId);
    if (!game)
      throw new Meteor.Error(401, "Game id not found!");

    var author = getUsername(user);

    if (!Players.findOne({gameId: gameId, userId: user._id})) {
      console.log('User ' + author + ' joining game ' + gameId);
      Players.insert({gameId: gameId, userId: user._id, name: author, lives: 3, damage: 0, visited_checkpoints: 0, needsRespawn: false, position: {x: -1, y: -1}});
    }

    Chat.insert({
      gameId: gameId,
      message: author + ' joined the game',
      submitted: new Date().getTime()
    });
  },

  leaveGame: function(gameId) {
    var user = Meteor.user();
    if (!user)
      throw new Meteor.Error(401, "You need to login to leave a game");
    var game = Games.findOne(gameId);
    if (!game)
      throw new Meteor.Error(401, "Game id not found!");

    var author = getUsername(user);
    console.log('User ' + author + ' leaving game ' + gameId);


    Players.remove({gameId: game._id, userId: user._id});
    if (game.started) {
      var players = Players.find({gameId: game._id}).fetch();
      if (players.length === 1) {
        Games.update(game._id, {$set: {gamePhase: GameState.PHASE.ENDED, winner: players[0].name}});
      } else if (players.length === 0) {
        console.log("Nobody left in the game.");
        Games.update(game._id, {$set: {gamePhase: GameState.PHASE.ENDED, winner: "Nobody"}});
      }
    }

    Chat.insert({
      gameId: gameId,
      message: author + ' left the game',
      submitted: new Date().getTime()
    });
  },

  selectBoard: function(boardName, gameId) {
    var user = Meteor.user();
    var game = Games.findOne(gameId);
    if (!game)
      throw new Meteor.Error(401, "Game id not found!");

    var board_id = BoardBox.getBoardId(boardName);
    if (board_id < 0)
      throw new Meteor.Error(401, "Board " + boardName + " not found!" );

    var min = BoardBox.getBoard(board_id).min_player;
    var max = BoardBox.getBoard(board_id).max_player;
    Games.update(game._id, {$set: {boardId: board_id, min_player: min, max_player: max}});

    var author = getUsername(user);
    console.log('User ' + author + ' selected ' + boardName + " for game " + gameId);
    Chat.insert({
      gameId: gameId,
      message: author + ' selected board ' + boardName,
      submitted: new Date().getTime()
    });
  },

  startGame: function(gameId) {
    var players = Players.find({gameId: gameId}).fetch();
    var game = Games.findOne(gameId);
    if (players.length > game.max_player) {
      throw new Meteor.Error(401, "Too many players.");
    }

    for (var i in players) {
      var start = game.board().startpoints[i];
      var player = players[i];
      player.position.x = start.x;
      player.position.y = start.y;
      player.direction = start.direction;
      player.robotId = i;
      player.start = start;
      Players.update(player._id, player);
    }

    console.log('set game started');

    Chat.insert({
      gameId: gameId,
      message: 'Game started',
      submitted: new Date().getTime()
    });

    GameState.nextGamePhase(gameId);
  },

  playCards: function(attributes) {
    var player = Players.findOne({gameId: attributes.gameId, userId: Meteor.userId()});
    if (!player)
      throw new Meteor.Error(401, 'Game/Player not found! ' + attributes.gameId);

    if (!player.submitted) {
      GameLogic.submitCards(player, attributes.cards);
      Chat.insert({
        gameId: player.gameId,
        message: 'Player ' + player.name + ' submitted cards',
        submitted: new Date().getTime()
      });
    } else {
      console.log("Player already submitted his cards.");
    }
  },

  robotReenterGame: function(gameId, direction) {
    var game = Games.findOne(gameId);
    var player = Players.findOne({gameId: attributes.gameId, userId: Meteor.userId()});
    GameLogic.resetRobot(game, player, direction);
    
    var message  = 'Player ' + player.name + ' chose ' + game.destroyedRobot.phase;
    Chat.insert({
        gameId: player.gameId,
        message: message,
        submitted: new Date().getTime()
      });
    console.log(message);
  },

  addMessage: function(postAttributes) {
    var user = Meteor.user();

    // ensure the user is logged in
    if (!user)
      throw new Meteor.Error(401, "You need to login to post messages");

    var author = getUsername(user);
    // pick out the whitelisted keys
    var message = _.extend(_.pick(postAttributes, 'message', 'gameId'), {
      userId: user._id,
      author: author,
      submitted: new Date().getTime()
    });
    Chat.insert(message);
  }
});
