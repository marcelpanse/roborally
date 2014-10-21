Template.gameList.helpers({
	games: function() {
		return Games.find({}, {sort: {submitted: -1}});
	}
});

Template.gameItemPostForm.helpers({
	gameCreated: function() {
		return Games.findOne({userId: Meteor.userId()});
	}
});

Template.gameItemPostForm.events({
	'submit form': function(event) {
		event.preventDefault();
		var game = {
			name: $(event.target).find('[name=name]').val()
		}

		Meteor.call('createGame', game, function(error, id) {
			if (error)
				return alert(error.reason);
			Router.go('gamePage', {_id: id});
		});
	}
});