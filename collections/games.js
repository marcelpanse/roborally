Games = new Meteor.Collection('games');

Games.allow({
	insert: function(userId, doc) {
		// only allow posting if you are logged in
		return !! userId;
	},
	remove: function(userId, doc) {
		return ownsDocument(userId, doc);
	}
});

Meteor.methods({
	createGame: function(postAttributes) {
		var user = Meteor.user(),
		gameWithSameName = Games.findOne({name: postAttributes.name});

		// ensure the user is logged in
		if (!user)
			throw new Meteor.Error(401, "You need to login to post new stories");
		// check that there are no previous posts with the same link
		if (postAttributes.name && gameWithSameName) {
			throw new Meteor.Error(302,	gameWithSameName._id);
		}
		var author = (user.profile) ? user.profile.name : user.emails[0].address;
		// pick out the whitelisted keys
		var game = _.extend(_.pick(postAttributes, 'name'), {
			userId: user._id,
			author: author,
			submitted: new Date().getTime()
		});
		var gameId = Games.insert(game);
		return gameId;
	}
});
