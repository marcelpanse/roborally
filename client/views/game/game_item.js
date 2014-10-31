Template.gameItem.helpers({
	ownGame: function() {
		return this.userId == Meteor.userId();
	}
});

Template.gameItem.events({
	'click .delete': function(e) {
		e.preventDefault();
		if (confirm("Remove this game?")) {
			Games.remove(this._id);
			Router.go('gamelist.page');
		}
	}
});
