Meteor.users.find({ "status.online": true }).observe({
  added: function(user) {
    console.log('came online!');
  },
  removed: function(user) {
    console.log(user._id + 'went offline!');
  }
});
