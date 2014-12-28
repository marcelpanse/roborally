var timerHandle = null;
Template.cards.helpers({
  chosenCards: function() {
    return addUIData(Session.get("chosenCards") || [], false);
  },
  availableCards: function() {
    console.log("available cards update");
    Session.set("availableCards", this.cards);

    return addUIData(this.cards, true);
  },
  playedCardsHtml: function() {
    return addUIData(this.playedCards || [], false);
  },
  showCards: function() {
    var cards = this.cards || [];
    return this.game.gamePhase == GameState.PHASE.PROGRAM && cards.length > 0 &&
      !Players.findOne({userId: Meteor.userId()}).submitted;
  },
  showPlayButton: function() {
    return !Players.findOne({userId: Meteor.userId()}).submitted;
  },
  timer: function() {
    if (this.game.timer === 1 && timerHandle === null) {
      console.log("starting timer");
      Session.set("timeLeft", 30);
      timerHandle = Meteor.setInterval(function() {
        Session.set("timeLeft", Math.max(0, Session.get("timeLeft") - 1));
      }, 1000);
    }
    if (this.game.timer === 0) {
      console.log("game timer = 0");
      submitCards(this.game);
      Session.set("timeLeft", 0);
      Meteor.clearInterval(timerHandle);
      timerHandle = null;
    }
    if (this.game.timer === -1) {
      console.log("game timer = -1");
      Session.set("timeLeft", 0);
      Meteor.clearInterval(timerHandle);
      timerHandle = null;
    }

    var timeLeft = Session.get("timeLeft") || 0;
    return  timeLeft > 0 ? "("+ timeLeft +")" : "";
  },
  gameState: function() {
    switch (this.game.gamePhase) {
      case GameState.PHASE.IDLE:
      case GameState.PHASE.DEAL:
        return "Dealing cards";
      case GameState.PHASE.ENDED:
        return "Game over";
      case GameState.PHASE.PROGRAM:
        return "Pick your cards";
      case GameState.PHASE.PLAY:
        switch (this.game.playPhase) {
          case GameState.PLAY_PHASE.IDLE:
          case GameState.PLAY_PHASE.REVEAL_CARDS:
            return "Revealing cards";
          case GameState.PLAY_PHASE.MOVE_BOTS:
            return "Moving bots";
          case GameState.PLAY_PHASE.MOVE_BOARD:
            return "Moving board elements";
          case GameState.PLAY_PHASE.LASERS:
            return "Shooting lasers";
          case GameState.PLAY_PHASE.CHECKPOINTS:
            return "Checkpoints";
        }
    }
    console.log(this.game.gamePhase, this.game.playPhase);
    return "Problem?";
  }
});

Template.card.events({
  'click .available': function(e) {
    if (!Players.findOne({userId: Meteor.userId()}).submitted) {
      var chosenCards = Session.get("chosenCards") || [];
      if (chosenCards.length < 5) {
        chosenCards.push(this);
        $(e.currentTarget).hide();
      }
      Session.set("chosenCards", chosenCards);
      $(".playBtn").toggleClass("disabled", chosenCards.length != 5);
    }
  },
  'click .played': function(e) {
    if (!Players.findOne({userId: Meteor.userId()}).submitted) {
      var cardId = this.cardId;
      var chosenCards = Session.get("chosenCards") || [];
      chosenCards = _.filter(chosenCards, function(item) {
        return item.cardId != cardId;
      });
      Session.set("chosenCards", chosenCards);

      $('.available.' + this.cardId).show();
      $(".playBtn").toggleClass("disabled", chosenCards.length != 5);
    }
  }
});

Template.cards.events({
  'click .playBtn': function(e) {
    submitCards(this.game);
  }
});

function submitCards(game) {
  var chosenCards = Session.get("chosenCards") || [];
  console.log("submitting cards", chosenCards);
  Meteor.call('playCards', {gameId: game._id, cards: chosenCards}, function(error) {
    Session.set("chosenCards", []);
    if (error)
      return alert(error.reason);
  });
}

function addUIData(cards, available) {
  cards.forEach(function(card) {
    if (card !== null) {
      card.class = available ? 'available' : 'played';
      card.type = ['f1', 'b', 'l', 'r', 'f2', 'f3', 'u'][card.cardType];
    }
  });
  return cards;
}
