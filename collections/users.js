Meteor.users.find({ "status.online": true }).observe({
  added: function(user) {
    console.log('came online!');
  },
  removed: function(user) {
    console.log(user._id + 'went offline!');

    //Games.remove({userId: user._id});

    // var games = Games.find({}, { players: {$elemMatch: {userId: user._id}}}).fetch();
    // games.forEach(function(game) {
    //   Meteor.call('leaveGame', {gameId: game._id, user: user}, function(error) {
    //     if (error)
    //       console.log(error.reason);
    //   });
    // });
  }
});
