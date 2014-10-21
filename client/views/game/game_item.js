Template.gameItem.helpers({
	ownGame: function() {
		return this.userId == Meteor.userId();
	}
});

Template.gameItem.events({
	'click .delete': function(e) {
		e.preventDefault();
		if (confirm("Remove this game?")) {
			var currentGameId = Session.get('currentGameId');
			Games.remove(currentGameId);
			Router.go('gameList');
		}
	}
});