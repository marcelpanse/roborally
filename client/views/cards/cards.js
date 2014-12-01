Template.cards.helpers({
  playedCards: function() {
    var sessionCards = Session.get("playedCards") || [];
    var cards = [];
    for (var j in sessionCards) {
      var card = sessionCards[j];
      cards.push(getCardHtml(card, 'played', j));
    }
    return cards;
  },
  availableCards: function() {
    Session.set("availableCards", this.cards);
    Session.set("cardsSubmitted", false);
    Session.set("playedCards", []);

    var cards = [];
    for (var j in this.cards) {
      var card = this.cards[j];
      cards.push(getCardHtml(card, 'available', j));
    }

    //Can't find a better way to do this. Template.rendered is only called once, not every update..
    Meteor.setTimeout(function() {
      $('[data-toggle="tooltip"]').tooltip();
    }, 100);

    return cards;
  },
  showCards: function() {
    return this.game.gamePhase == GameState.PHASE.PROGRAM;
  },
  showPlayButton: function() {
    return !Session.get("cardsSubmitted");
  }
});

function getCardHtml(card, type, index) {
  switch (card) {
    case 0:
      return "<span class='card "+ type +"' data-card='"+ index +"' data-toggle='tooltip' title='1 step forward'><i class='fa fa-long-arrow-up' /></span>";
    case 1:
      return "<span class='card "+ type +"' data-card='"+ index +"' data-toggle='tooltip' title='Backup'><i class='fa fa-long-arrow-down' /></span>";
    case 2:
      return "<span class='card "+ type +"' data-card='"+ index +"' data-toggle='tooltip' title='Rotate counter-clockwise'><i class='fa fa-rotate-left' /></span>";
    case 3:
      return "<span class='card "+ type +"' data-card='"+ index +"' data-toggle='tooltip' title='Rotate clockwise'><i class='fa fa-rotate-right' /></span>";
    case 4:
      return "<span class='card "+ type +"' data-card='"+ index +"' data-toggle='tooltip' title='2 steps forward'><i class='fa fa-long-arrow-up' /><i class='fa fa-long-arrow-up' /></span>";
    case 5:
      return "<span class='card "+ type +"' data-card='"+ index +"' data-toggle='tooltip' title='3 steps forward'><i class='fa fa-long-arrow-up' /><i class='fa fa-long-arrow-up' /><i class='fa fa-long-arrow-up' /></span>";
    case 6:
      return "<span class='card "+ type +"' data-card='"+ index +"' data-toggle='tooltip' title='U-turn'><i class='fa fa-arrows-v' /></span>";
  }
  return "";
}

Template.cards.events({
  'click .available': function(e) {
    if (!Session.get("cardsSubmitted")) {
      var card = $(e.currentTarget).data("card");
      var playedCards = Session.get("playedCards") || [];
      var availableCards = Session.get("availableCards") || [];
      if (playedCards.length < 5) {
        playedCards.push(availableCards[card]);
        $(e.currentTarget).hide();
      }
      Session.set("playedCards", playedCards);
      $(".playBtn").toggleClass("disabled", playedCards.length != 5);
    }
  },
  'click .played': function(e) {
    if (!Session.get("cardsSubmitted")) {
      var card = $(e.currentTarget).data("card");
      var playedCards = Session.get("playedCards") || [];
      var availableCards = Session.get("availableCards") || [];

      for (var i in availableCards) {
        if (availableCards[i] == playedCards[card]) {
          var a = $($('.available')[i]);
          if (!a.is(":visible")) {
            a.show();
            break;
          }
        }
      }
      playedCards.splice(card, 1);
      Session.set("playedCards", playedCards);
      $(".playBtn").toggleClass("disabled", playedCards.length != 5);
    }
  },
  'click .playBtn': function(e) {
    var playedCards = Session.get("playedCards") || [];
    if (playedCards.length == 5) {
      Meteor.call('playCards', {gameId: this.game._id, cards: playedCards}, function(error) {
        if (error)
          return alert(error.reason);
        Session.set("playedCards", []);
        Session.set("cardsSubmitted", true);
      });
    }
  }
});
