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
  getHandCards: function() {
    return Cards.findOne({playerId: this._id});
  },
  updateHandCards: function(cards) {
    Cards.upsert({playerId: this._id}, cards);
  }
	isOnBoard: function() {
		var a = this.board().onBoard(this.position.x, this.position.y);
    if (!a) {
      console.log("Player fell off the board", this.name);
    }
    return a;
	},
  isOnVoid: function() {
    var a = this.tile().type === Tile.VOID;
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
  },
  chat: function(msg, debug_info) {
    msg = this.name + ' ' + msg;
    Chat.insert({
      gameId: this.gameId,
      message: msg,
      submitted: new Date().getTime()
    });
    if (debug_info !== undefined)
      msg += ' ' + debug_info;
    console.log(msg);
  },
  togglePowerDown: function() {
    switch (this.powerState) {
      case GameLogic.DOWN:
        this.powerState = GameLogic.ON;
        break;
      case GameLogic.ON:
        this.powerState = GameLogic.DOWN;
        break;
      case GameLogic.OFF:
        this.powerState = GameLogic.ON;
				break;
    }
    console.log("new power state "+this.powerState);
    Players.update(this._id, {$set:{powerState: this.powerState}});
    return this.powerState;
  },
  isPoweredDown: function() {
    return this.powerState === GameLogic.OFF;
  },

  lockedCnt: function() {
    return  Math.max(0, GameLogic.CARD_SLOTS + this.damage - CardLogic._MAX_NUMBER_OF_CARDS);
  },
  lockedCards: function() {
    if (this.lockedCnt() > 0)
      return this.submittedCards.slice(GameLogic.CARD_SLOTS-this.lockedCnt(), this.lockedCnt());
    else
      return [];
  }
  notLockedCards: function() {
    if (this.lockedCnt() == GameLogic.CARD_SLOTS)
      return []
    else
      return this.submittedCards.slice(0, GameLogic.CARD_SLOTS-this.lockedCnt()-1);
  }
  playedCards: function() {
    return this.submittedCards.slice(this.playedCardsCnt);
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
