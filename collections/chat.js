Chat = new Meteor.Collection('chat');

Chat.allow({
  insert: function(userId, doc) {
    // only allow posting if you are logged in
    return !! userId;
  }
});
