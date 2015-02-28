var game = {
  btest: BoardBox.getBoard(this.boardId),
  board: function() {
    return BoardBox.getBoard(this.boardId);
	},
  players: function() {
    return Players.find({gameId: game._id}).fetch();
  }
};




Games = new Meteor.Collection('games', {
  transform: function (doc) {
  	var newInstance = Object.create(game);
    return  _.extend(newInstance, doc);
  }
});

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
