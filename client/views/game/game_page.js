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
			Router.go('gamelist.page');
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
	},

	'click .start': function(e) {
		e.preventDefault();

		Meteor.call('startGame', this._id, function(error) {
			if (error)
				return alert(error.reason);
		});
	}
});

Template.gamePage.rendered = function() {
	Games.find().observe({changed: function(game) {
		if (game.started && _.findWhere(game.players, {userId: Meteor.userId()})) {
			console.log('game started');
			Router.go('board.page', {_id: game._id});
		}
	}});
};
