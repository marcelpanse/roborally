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
      boardId: Tiles.BOARD_DEFAULT
    });
    if(game.name==='test_bed_1')
      game.boardId=Tiles.BOARD_TEST_BED_1;
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
      Players.insert({gameId: gameId, userId: user._id, name: author, lives: 3, damage: 0, position: {x: -1, y: -1}});
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

    if (game.started) {
      var player = Players.findOne({gameId: game._id, userId: { $ne: Meteor.userId() }});
      Games.update(game._id, {$set: {gamePhase: GameState.PHASE.ENDED, winner: player.name}});
    } else {
      Players.remove({gameId: game._id, userId: user._id});
    }

    Chat.insert({
      gameId: gameId,
      message: author + ' left the game',
      submitted: new Date().getTime()
    });
  },

  startGame: function(gameId) {
    var players = Players.find({gameId: gameId}).fetch();
    if (players.length != 2) {
      throw new Meteor.Error(401, "Need exactly 2 players to start the game");
    }

    for (var i in players) {
      var start = Tiles.getStartPosition(players,i);
      var player = players[i];
      player.position.x = start.x;
      player.position.y = start.y;
      player.direction = start.direction;
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
