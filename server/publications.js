Meteor.publish('games', function() {
	return Games.find();
});

Meteor.publish('chat', function() {
	return Chat.find();
});

Meteor.publish("onlineUsers", function() {
  return Meteor.users.find({ "status.online": true });
});
