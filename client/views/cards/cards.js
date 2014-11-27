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
    console.log('re-rendering cards');
    Session.set("availableCards", this.cards);

    var cards = [];
    for (var j in this.cards) {
      var card = this.cards[j];
      cards.push(getCardHtml(card, 'available', j));
    }
    return cards;
  }
});

function getCardHtml(card, type, index) {
  switch (card) {
    case 0:
      return "<span class='card "+ type +"' data-card='"+ index +"'><i class='fa fa-long-arrow-up' data-toggle='tooltip' title='1 step forward' /></span>";
    case 1:
      return "<span class='card "+ type +"' data-card='"+ index +"'><i class='fa fa-long-arrow-down' data-toggle='tooltip' title='Backup'/></span>";
    case 2:
      return "<span class='card "+ type +"' data-card='"+ index +"'><i class='fa fa-rotate-left' data-toggle='tooltip' title='Rotate counter-clockwise'/></span>";
    case 3:
      return "<span class='card "+ type +"' data-card='"+ index +"'><i class='fa fa-rotate-right' data-toggle='tooltip' title='Rotate clockwise'/></span>";
    case 4:
      return "<span class='card "+ type +"' data-card='"+ index +"'><i class='fa fa-long-arrow-up' data-toggle='tooltip' title='2 steps forward'/><i class='fa fa-long-arrow-up' data-toggle='tooltip' title='2 steps forward'/></span>";
    case 5:
      return "<span class='card "+ type +"' data-card='"+ index +"'><i class='fa fa-long-arrow-up' data-toggle='tooltip' title='3 steps forward'/><i class='fa fa-long-arrow-up' data-toggle='tooltip' title='3 steps forward'/><i class='fa fa-long-arrow-up' data-toggle='tooltip' title='3 steps forward'/></span>";
    case 6:
      return "<span class='card "+ type +"' data-card='"+ index +"'><i class='fa fa-arrows-v' data-toggle='tooltip' title='U-turn'/></span>";
  }
  return "";
}

Template.cards.events({
  'click .available': function(e) {
    var card = $(e.currentTarget).data("card");
    var playedCards = Session.get("playedCards") || [];
    var availableCards = Session.get("availableCards") || [];
    if (playedCards.length < 5) {
      playedCards.push(availableCards[card]);
      $(e.currentTarget).hide();
    }
    Session.set("playedCards", playedCards);
    $(".playBtn").toggleClass("disabled", playedCards.length != 5);
  },
  'click .played': function(e) {
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
  },
  'click .playBtn': function(e) {
    var playedCards = Session.get("playedCards") || [];
    if (playedCards.length == 5) {
      Meteor.call('playCards', {gameId: this.gameId, cards: playedCards}, function(error) {
        if (error)
          return alert(error.reason);
        Session.set("playedCards", []);
      });
    }
  }
});

Template.cards.rendered = function() {
  $('[data-toggle="tooltip"]').tooltip();
};
