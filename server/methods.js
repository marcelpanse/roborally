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
      started: false
    });
    var gameId = Games.insert(game);

    // analytics.track(user._id, 'Game created', {
    //   id: gameId,
    //   name: game.name,
    //   user: author
    // });

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
      Players.insert({gameId: gameId, userId: user._id, name: author});
    }

    // analytics.track('Game joined', {
    //   id: gameId,
    //   name: game.name,
    //   user: author
    // });
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

    // analytics.track('Left game', {
    //   id: postAttributes.gameId,
    //   user: author
    // });
  },

  startGame: function(gameId) {
    var players = Players.find({gameId: gameId}).fetch();
    if (players.length != 2) {
      throw new Meteor.Error(401, "Need exactly 2 players to start the game");
    }

    for (var i in players) {
      GameLogic.updatePosition(players[i], GameLogic.DEFAULT_X, GameLogic.DEFAULT_Y, GameLogic.DEFAULT_DIRECTION);
      GameLogic.drawCards(players[i]);
    }

    console.log('set game started');
    Games.update(gameId, {$set: {started: true}});

    // analytics.track('Game started', {
    //   id: gameId,
    //   name: game.name
    // });
  },

  playCards: function(attributes) {
    var player = Players.findOne({gameId: attributes.gameId, userId: Meteor.userId()});
    if (!player)
      throw new Meteor.Error(401, 'Game/Player not found! ' + attributes.gameId);
    GameLogic.playCards(player, attributes.cards);
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
