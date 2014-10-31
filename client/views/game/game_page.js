Template.gamePageActions.helpers({
	ownGame: function() {
		return this.userId == Meteor.userId();
	},
	inGame: function() {
		var currentGameId = Session.get('currentGameId');
		var players = Games.findOne(currentGameId).players;
		return _.findWhere(players, {userId: Meteor.userId()});
	},
	gameReady: function() {
		var currentGameId = Session.get('currentGameId');
		var players = Games.findOne(currentGameId).players;
		return players && players.length >= 2;
	}
});

Template.gamePageActions.events({
	'click .delete': function(e) {
		e.preventDefault();
		if (confirm("Remove this game?")) {
			var currentGameId = Session.get('currentGameId');
			Games.remove(currentGameId);
			Router.go('gameList');
		}
	},
	'click .join': function(e) {
		e.preventDefault();

		Meteor.call('joinGame', Session.get('currentGameId'), function(error) {
			if (error)
				return alert(error.reason);
		});
	},
	'click .leave': function(e) {
		e.preventDefault();

		Meteor.call('leaveGame', {gameId: Session.get('currentGameId')}, function(error) {
			if (error)
				return alert(error.reason);
		});
	}
});
