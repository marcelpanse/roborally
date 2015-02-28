var game = {
  board: function() {
    return BoardBox.getBoard(this.boardId);
	},
  tile: function() {
    return game.board.getTile(this.position.x, this.position.y);
  }
	isOnBoard: function() {
		var a = this.tile
    if (!a) {
      console.log("Player fell off the board", player.name);
    }
    return a;
	},
  isOnVoid: function() {
    var a = this.tile.type == Tile.VOID
    if (a) {
      console.log("Player fell into the void", player.name);
    }
    return a;
  }
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
