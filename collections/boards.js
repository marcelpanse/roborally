Boards = new Meteor.Collection('boards', {
  transform: function (doc) {
    var newInstance = Object.create(Board);
    return  _.extend(newInstance, doc);
  }
});

Boards.allow({
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