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
    var c = Cards.findOne({playerId: this._id});
    return c ? c.handCards : [];
  },
  getChosenCards: function() {
    var c = Cards.findOne({playerId: this._id});
    return c ? c.chosenCards : [];
  },
  updateHandCards: function(cards) {
    Cards.upsert({playerId: this._id}, {$set:{handCards:cards}});
  },
  chooseCard: function(card, index) {
    var cards = this.getChosenCards();
    var inc = 0;
    if (cards[index] === CardLogic.EMPTY)
      inc = 1;
    cards[index] = card;
    console.log("update chosen cards", index,card);
    Cards.update({playerId: this._id}, {
      $set:{chosenCards:cards},
    });
    this.cards[index] = CardLogic.COVERED;
    Players.update(this._id, {
      $set:{cards: this.cards},
      $inc:{chosenCardsCnt:inc}
    });
  },
  unchooseCard: function(index) {
    var cards = this.getChosenCards();
    if (cards[index] !== CardLogic.EMPTY) {
      cards[index] = CardLogic.EMPTY;
      Cards.update({playerId: this._id}, {
        $set:{chosenCards:cards},
      });
      this.cards[index] = CardLogic.EMPTY;
      Players.update(this._id, {
        $set:{cards: this.cards},
        $inc:{chosenCardsCnt:-1}
      });
    }
  },
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
  notLockedCnt: function() {
    return  GameLogic.CARD_SLOTS - this.lockedCnt();
  },
  notLockedCards: function() {
    if (this.lockedCnt() == GameLogic.CARD_SLOTS)
      return [];
    else
      return this.getChosenCards().slice(0, Math.max(this.getChosenCards.length, this.notLockedCnt()));
  },
  playedCards: function() {
    return this.getChosenCards().slice(0,this.playedCardsCnt);
  },
  isActive: function() {
    return !this.isPoweredDown() && !this.needsRespawn && this.lives > 0;
  },
  addDamage: function(inc) {
    this.damage += inc;
    if (this.isPoweredDown() && this.lockedCnt() > 0) {
      // powered down robot has no cards so we have to draw from deck to get locked cards
      var deck = this.game().getDeck();
      var chosenCards = this.getChosenCards();
      for (var i=0;i<this.lockedCnt();i++) {
        this.cards[this.notLockedCnt()+i] = deck.cards.shift();
        chosenCards[this.notLockedCnt()+i] = this.cards[this.notLockedCnt()+i];
      }
      Deck.update(deck._id, deck);
      Players.update( this._id, this);
      Cards.update( {playerId: this._id}, { $set: {
            chosenCards: chosenCards
          }});
    }
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
