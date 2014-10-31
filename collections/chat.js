Chat = new Meteor.Collection('chat');

Chat.allow({
	insert: function(userId, doc) {
		// only allow posting if you are logged in
		return !! userId;
	}
});

Meteor.methods({
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
