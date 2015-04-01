Template.thumbnail.helpers({
	player: function() {
      for (var i in this.players) {
        var player = this.players[i];
        if (player.userId === Meteor.userId()) {
          return player;
        }
      }
    }
});
