Template.gameList.helpers({
  openGames: function() {
    return Games.find({winner: null, started: false}, {sort: {submitted: -1}});
  },
  activeGames: function() {
    return Games.find({winner: null, started: true}, {sort: {submitted: -1}});
  },
  endedGames: function() {
    return Games.find({winner: {$exists: true}}, {sort: {submitted: -1}});
  }
});

Template.gameItemPostForm.helpers({
  gameCreated: function() {
    return Games.findOne({userId: Meteor.userId(), winner: null});
  }
});

Template.gameItemPostForm.events({
  'submit form': function(event) {
    event.preventDefault();
    var game = {
      name: $(event.target).find('[name=name]').val()
    };

    Meteor.call('createGame', game, function(error, id) {
      if (error)
        return alert(error.reason);
      mixpanel.track("game-created");
      Router.go('game.page', {_id: id});
    });
  }
});
