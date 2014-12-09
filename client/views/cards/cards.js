Template.cards.helpers({
  chosenCards: function() {
    reAddTooltip();
    return addUIData(Session.get("chosenCards") || [], false);
  },
  availableCards: function() {
    Session.set("availableCards", this.cards);
    Session.set("cardsSubmitted", false);
    Session.set("chosenCards", []);

    reAddTooltip();
    return addUIData(this.cards, true);
  },
  playedCardsHtml: function() {
    reAddTooltip();
    return addUIData(this.playedCards || [], false);
  },
  showCards: function() {
    var cards = this.cards || [];
    return this.game.gamePhase == GameState.PHASE.PROGRAM && cards.length > 0;
  },
  showPlayButton: function() {
    return !Session.get("cardsSubmitted");
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

function reAddTooltip() {
  //Can't find a better way to do this. Template.rendered is only called once, not every update..
  Meteor.setTimeout(function() {
    $(".tooltip").remove();
    $('[data-toggle="tooltip"]').tooltip();
  }, 100);
}

Template.card.events({
  'click .available': function(e) {
    if (!Session.get("cardsSubmitted")) {
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
    if (!Session.get("cardsSubmitted")) {
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
    var chosenCards = Session.get("chosenCards") || [];
    if (chosenCards.length == 5) {
      Meteor.call('playCards', {gameId: this.game._id, cards: chosenCards}, function(error) {
        if (error)
          return alert(error.reason);
        Session.set("chosenCards", []);
        Session.set("cardsSubmitted", true);
      });
    }
  }
});

function addUIData(cards, available) {
  cards.forEach(function(card) {
    if (card !== null) {
      card.class = available ? 'available' : 'played';
      switch (card.cardType) {
        case 0:
          card.title = '1 step forward';
          card.icon = 'fa-long-arrow-up';
          break;
        case 1:
          card.title = 'Backup';
          card.icon = 'fa-long-arrow-down';
          break;
        case 2:
          card.title = 'Rotate left';
          card.icon = 'fa-rotate-left';
          break;
        case 3:
          card.title = 'Rotate right';
          card.icon = 'fa-rotate-right';
          break;
        case 4:
          card.title = '2 steps forward';
          card.icon = 'fa-long-arrow-up';
          card.steps = 2;
          break;
        case 5:
          card.title = '3 steps forward';
          card.icon = 'fa-long-arrow-up';
          card.steps = 3;
          break;
        case 6:
          card.title = 'U-turn';
          card.icon = 'fa-arrows-v';
          break;
      }
    }
  });
  return cards;
}
