Meteor.publish('games', function() {
  return Games.find({}, {limit: 10, sort: {submitted: -1}});
});

Meteor.publish('chat', function(gameId) {
  return Chat.find({ gameId: gameId }, {limit: 100, sort: {submitted: -1}});
});

Meteor.publish("onlineUsers", function() {
  return Meteor.users.find({ "status.online": true });
});

Meteor.publish("players", function(gameId) {
  return Players.find({ gameId: gameId });
});

Meteor.publish("cards", function(gameId) {
  return Cards.find({ gameId: gameId, userId: this.userId });
});
