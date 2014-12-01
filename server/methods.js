Meteor.methods({
  createGame: function(postAttributes) {
    var user = Meteor.user(),
    gameWithSameName = Games.findOne({name: postAttributes.name});

    // ensure the user is logged in
    if (!user)
      throw new Meteor.Error(401, "You need to login to post new stories");
    // check that there are no previous posts with the same link
    if (postAttributes.name && gameWithSameName) {
      throw new Meteor.Error(302,  gameWithSameName._id);
    }
    if (!postAttributes.name || postAttributes.name === '') {
      throw new Meteor.Error(303, 'Name cannot be empty.');
    }
    var author = (user.profile) ? user.profile.name : user.emails[0].address;
    // pick out the whitelisted keys
    var game = _.extend(_.pick(postAttributes, 'name'), {
      userId: user._id,
      author: author,
      submitted: new Date().getTime(),
      started: false,
      gamePhase: GameState.PHASE.IDLE,
      playPhase: GameState.PLAY_PHASE.IDLE,
      playPhaseCount: 0
    });
    var gameId = Games.insert(game);

    return gameId;
  },

  joinGame: function(gameId) {
    var user = Meteor.user();

    if (!user)
      throw new Meteor.Error(401, "You need to login to join a game");
    var game = Games.findOne(gameId);
    if (!game)
      throw new Meteor.Error(401, "Game id not found!");

    var author = (user.profile) ? user.profile.name : user.emails[0].address;

    if (!Players.findOne({gameId: gameId, userId: user._id})) {
      console.log('User ' + author + ' joining game ' + gameId);
      Players.insert({gameId: gameId, userId: user._id, name: author, position: {x: -1, y: -1}});
    }
  },

  leaveGame: function(postAttributes) {
    var user = Meteor.user();
    if (postAttributes.user) {
      user = postAttributes.user;
    }

    if (!user)
      throw new Meteor.Error(401, "You need to login to leave a game");
    var game = Games.findOne(postAttributes.gameId);
    if (!game)
      throw new Meteor.Error(401, "Game id not found!");

    var author = (user.profile) ? user.profile.name : user.emails[0].address;
    console.log('User ' + author + ' leaving game ' + postAttributes.gameId);

    Players.remove({gameId: game._id, userId: user._id});
  },

  startGame: function(gameId) {
    var players = Players.find({gameId: gameId}).fetch();
    if (players.length != 2) {
      throw new Meteor.Error(401, "Need exactly 2 players to start the game");
    }

    for (var i in players) {
      var start = Tiles.getStartPosition(players);
      GameLogic.updatePosition(players[i], start.x, start.y, start.direction);
    }

    console.log('set game started');
    GameState.nextGamePhase(gameId);
  },

  playCards: function(attributes) {
    var player = Players.findOne({gameId: attributes.gameId, userId: Meteor.userId()});
    if (!player)
      throw new Meteor.Error(401, 'Game/Player not found! ' + attributes.gameId);

    GameLogic.submitCards(player, attributes.cards);
  },

  addMessage: function(postAttributes) {
    var user = Meteor.user();

    // ensure the user is logged in
    if (!user)
      throw new Meteor.Error(401, "You need to login to post new stories");

    var author = (user.profile) ? user.profile.name : user.emails[0].address;
    // pick out the whitelisted keys
    var message = _.extend(_.pick(postAttributes, 'message', 'gameId'), {
      userId: user._id,
      author: author,
      submitted: new Date().getTime()
    });
    var messageId = Chat.insert(message);
    return messageId;
  }
});
