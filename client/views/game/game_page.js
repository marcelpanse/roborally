Template.gamePageActions.helpers({
	ownGame: function() {
		return this.userId == Meteor.userId();
	},
	inGame: function() {
		var players = Games.findOne(this._id).players;
		return players && _.findWhere(players, {userId: Meteor.userId()});
	},
	gameReady: function() {
		var players = Games.findOne(this._id).players;
		return players && players.length >= 2;
	}
});

Template.gamePageActions.events({
	'click .delete': function(e) {
		e.preventDefault();
		if (confirm("Remove this game?")) {
			Games.remove(this._id);
			Router.go('gameList');
		}
	},
	'click .join': function(e) {
		e.preventDefault();

		Meteor.call('joinGame', this._id, function(error) {
			if (error)
				return alert(error.reason);
		});
	},
	'click .leave': function(e) {
		e.preventDefault();

		Meteor.call('leaveGame', {gameId: this._id}, function(error) {
			if (error)
				return alert(error.reason);
		});
	}
});
