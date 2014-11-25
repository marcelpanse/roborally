Template.cards.helpers({
  availableCards: function() {
    var cards = [];
    for (var i in this.players) {
      if (this.players[i].userId == Meteor.userId()) {
        for (var j in this.players[i].cards) {
          var card = this.players[i].cards[j];
          switch (card) {
            case 0:
              cards.push("<i class='fa fa-long-arrow-up' data-card='0' data-toggle='tooltip' title='1 step forward' />");
              break;
            case 1:
              cards.push("<i class='fa fa-long-arrow-down' data-card='1' data-toggle='tooltip' title='Backup'/>");
              break;
            case 2:
              cards.push("<i class='fa fa-rotate-left' data-card='2' data-toggle='tooltip' title='Rotate counter-clockwise'/>");
              break;
            case 3:
              cards.push("<i class='fa fa-rotate-right' data-card='3' data-toggle='tooltip' title='Rotate clockwise'/>");
              break;
            case 4:
              cards.push("<i class='fa fa-long-arrow-up' data-card='4' data-toggle='tooltip' title='2 steps forward'/><i class='fa fa-long-arrow-up' data-toggle='tooltip' title='2 steps forward'/>");
              break;
            case 5:
              cards.push("<i class='fa fa-long-arrow-up' data-card='5' data-toggle='tooltip' title='3 steps forward'/><i class='fa fa-long-arrow-up' data-toggle='tooltip' title='3 steps forward'/><i class='fa fa-long-arrow-up' data-toggle='tooltip' title='3 steps forward'/>");
              break;
            case 6:
              cards.push("<i class='fa fa-arrows-v' data-card='6' data-toggle='tooltip' title='U-turn'/>");
              break;
          }
        }
        break;
      }
    }
    return cards;
  }
});

Template.cards.events({
  'click .card': function(e) {
    if ($(".card.selected").length < 3) {
      $(e.currentTarget).toggleClass('selected');
    } else {
      $(e.currentTarget).removeClass('selected');
    }

    $(".playBtn").toggleClass("disabled", $(".card.selected").length != 3);
  },
  'click .playBtn': function(e) {
    if ($(".card.selected").length == 3) {
      var selectedCards = [];
      $(".card.selected i").each(function() {
        selectedCards.push(Number($(this).data('card')));
      });

      Meteor.call('playCards', {gameId: this._id, cards: selectedCards}, function(error) {
        if (error)
          return alert(error.reason);
        $(".card.selected").removeClass('selected');
      });
    }
  }
});

Template.cards.rendered = function() {
  $('[data-toggle="tooltip"]').tooltip();
};
