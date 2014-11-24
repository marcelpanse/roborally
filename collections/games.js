Games = new Meteor.Collection('games');

Games.allow({
  insert: function(userId, doc) {
    // only allow posting if you are logged in
    return !! userId;
  },
  remove: function(userId, doc) {
    return ownsDocument(userId, doc);
  },
  update: function(userId, doc) {
    return true;
  }
});
