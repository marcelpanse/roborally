var player = {
	game: function() {
		return Games.findOne(this.gameId);
	},
  board: function() {
    return this.game.board;
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
  },
  updateStartPosition: function() {
    this.start = {x: this.position.x, y:this.position.y};
  },
  move: function(step) {
    this.position.x += step.x;
    this.position.y += step.y;
  },
  rotate: function(rotation) {
    this.direction += rotation + 4;
    this.direction %= 4;
  }

};


Players = new Meteor.Collection('players', {
  transform: function (doc) {
  	var newInstance = Object.create(player);
    return  _.extend(newInstance, doc);
  }
});

Players.allow({
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



