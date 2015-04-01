var deck = {
};

Deck = new Meteor.Collection('deck', {
  transform: function (doc) {
    var newInstance = Object.create(deck);
    return  _.extend(newInstance, doc);
  }
});

Deck.allow({
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
