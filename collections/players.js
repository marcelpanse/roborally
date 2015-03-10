var player = {
	game: function() {
		return Games.findOne(this.gameId);
	},
  board: function() {
    return Games.findOne(this.gameId).board();
  },
  tile: function() {
    return this.board().getTile(this.position.x, this.position.y);
  },
	isOnBoard: function() {
		var a = this.board().onBoard(this.position.x, this.position.y);
    if (!a) {
      console.log("Player fell off the board", this.name);
    }
    return a;
	},
  isOnVoid: function() {
    var a = this.tile().type == Tile.VOID;
    if (a) {
      console.log("Player fell into the void", this.name);
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
