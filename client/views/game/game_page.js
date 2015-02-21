Template.gamePageActions.helpers({
  ownGame: function() {
    return this.userId == Meteor.userId();
  },
  inGame: function() {
    return Players.findOne({gameId: this._id, userId: Meteor.userId()});
  },
  gameReady: function() {
    return Players.find().fetch().length >= this.min_player;
  },
  gameFull: function() {
    return Players.find().fetch().length >= 8;
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

    Meteor.call('leaveGame', this._id, function(error) {
      if (error)
        return alert(error.reason);
    });
  },

  'click .start': function(e) {
    e.preventDefault();

    Meteor.call('startGame', this._id, function(error) {
      if (error)
        return alert(error.reason);
      analytics.track("game-started");
    });
  }
});
