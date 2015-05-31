Highscores = new Meteor.Collection('highscores');

Highscores.allow({
  insert: function(userId, doc) {
    return false;
  },
  update: function(userId, doc) {
    return false;
  },
  remove: function(userId, doc) {
    return false;
  }
});
