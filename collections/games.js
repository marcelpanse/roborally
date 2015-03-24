var game = {
  board: function() {
    return BoardBox.getBoard(this.boardId);
	},
  players: function() {
    return Players.find({gameId: this._id}).fetch();
  },
  playerCnt: function() {
    return Players.find({gameId: this._id}).count();
  },
  isPlayerOnTile: function(x,y) {
    var found = null;
    this.players().forEach(function(player) {
      if (player.position.x == x && player.position.y == y) {
        found = player;
      }
    });
    return found;
  },
  chat: function(msg, debug_info) {
    Chat.insert({
      gameId: this._id,
      message: msg,
      submitted: new Date().getTime()
    });
    if (debug_info !== undefined)
      msg += ' ' + debug_info;
    console.log(msg);
  },
  nextPlayPhase: function(phase) {
    if (phase !== undefined) {
      this.setPlayPhase(phase);
    }
    GameState.nextPlayPhase(this._id);
  },
  nextGamePhase: function(phase) {
    if (phase !== undefined) {
      this.setGamePhase(phase);
    }
    GameState.nextGamePhase(this._id);
  },
  nextRespawnPhase: function(phase) {
    if (phase !== undefined) {
      this.setRespawnPhase(phase);
    }
    GameState.nextRespawnPhase(this._id);
  },
  setPlayPhase: function(phase) {
    Games.update(this._id, {$set: {
      playPhase: phase
    }});
  },
  setGamePhase: function(phase) {
    Games.update(this._id, {$set: {
      gamePhase: phase
    }});
  },
  setRespawnPhase: function(phase) {
    Games.update(this._id, {$set: {
      respawnPhase: phase
    }});
  },
  getDeck: function() {
    return Deck.findOne({gameId: this._id});
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
