Games = new Meteor.Collection('games');

Games.allow({
  insert: function(userId, doc) {
    return false;
  },
  update: function(userId, doc) {
    return false;
  },
  remove: function(userId, doc) {
    return ownsDocument(userId, doc);
  }
});
