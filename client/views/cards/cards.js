var timerHandle = null;
Template.cards.helpers({
  chosenCards: function() {
    return addUIData(getChosenCards(), false);
  },
  availableCards: function() {
    Session.set("availableCards", this.cards);
    return addUIData(this.cards, true);
  },
  lockedCardsHtml: function() {
    return addUIData(this.lockedCards || [], false);
  },
  playedCardsHtml: function() {
    return addUIData(this.playedCards || [], false);
  },
  showPowerState: function() {
    return this.powerState != GameLogic.ON;
  },
  showCards: function() {
    var cards = this.cards || [];
    if(this.game.gamePhase == GameState.PHASE.PROGRAM &&
       Players.findOne({userId: Meteor.userId()}) &&
       !Players.findOne({userId: Meteor.userId()}).submitted) {
      if(cards.length>0) {
        return true;
      } else {
        submitCards(this.game);
        return false;
      }
    }
  },
  showPlayButton: function() {
    return !Players.findOne({userId: Meteor.userId()}).submitted;
  },
  timer: function() {
    if (this.game.timer === 1 && timerHandle === null) {
      console.log("starting timer");
      Session.set("timeLeft", GameLogic.TIMER);
      timerHandle = Meteor.setInterval(function() {
        Session.set("timeLeft", Math.max(0, Session.get("timeLeft") - 1));
      }, 1000);
      if (!Players.findOne({userId: Meteor.userId()}).submitted)
        $(document).find('.col-md-4.well').addClass('countdown');
    }
    if (this.game.timer === 0) {
      console.log("game timer = 0");
      submitCards(this.game);
      Session.set("timeLeft", 0);
      Meteor.clearInterval(timerHandle);
      timerHandle = null;
    }
    if (timerHandle &&  Session.get("timeLeft") <= 5 && !Players.findOne({userId: Meteor.userId()}).submitted)  {
      $(document).find('.col-md-4.well').removeClass('countdown');
      $(document).find('.col-md-4.well').addClass('finish');
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
        var player = Players.findOne({userId: Meteor.userId()});
        if (player.isPoweredDown() && !player.optionalInstantPowerDown)
          return "Powered down";
        else
          return "Pick your cards";
        break;
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
          case GameState.PLAY_PHASE.REPAIRS:
            return "Repairing bots";
        }
        break;
      case GameState.PHASE.RESPAWN:
        switch (this.game.respawnPhase) {
          case GameState.RESPAWN_PHASE.CHOOSE_POSITION:
            if (this.game.respawnUserId === Meteor.userId())
              return "Choose position";
            else
              return "Waiting for destroyed bots to reenter";
            break;
          case GameState.RESPAWN_PHASE.CHOOSE_DIRECTION:
            if (this.game.respawnUserId === Meteor.userId())
              return "Choose direction";
            else
              return "Waiting for destroyed bots to reenter";
        }
        break;
    }
    console.log(this.game.gamePhase, this.game.playPhase, this.game.respawnPhase);
    return "Problem?";
  },
  ownPowerStateName: function() {
    var player = Players.findOne({userId: Meteor.userId()});
    switch (player.powerState) {
      case GameLogic.OFF:
        return  'cancel power down';
      case GameLogic.DOWN:
        return  'cancel announce power down';
      case GameLogic.ON:
        return  'announce power down';
    }
  },
  ownPowerStateStyle: function() {
    var player = Players.findOne({userId: Meteor.userId()});
    switch (player.powerState) {
      case GameLogic.DOWN:
      case GameLogic.OFF:
        return  'btn-danger';
      case GameLogic.ON:
        return  'btn-warning';
    }
  },
  poweredDown: function() {
    var player = Players.findOne({userId: Meteor.userId()});
    return player.isPoweredDown();
  }
});

Template.card.helpers({
  emptyCard: function() {
    return this.type === 'empty';
  },
  selected: function() {
    return this.slot === getSlotIndex() ? 'selected' : '';
  },
  isSelected: function() {
    return this.slot === getSlotIndex();
  },
  timer: function() {
    var timeLeft = Session.get("timeLeft") || 0;
    return timeLeft > 0 ? "("+ timeLeft +")" : "";
  }
});

Template.card.events({
  'click .available': function(e) {
    var player = Players.findOne({userId: Meteor.userId()});
    if (!player.submitted && getChosenCnt() < 5) {
      chooseCard(this);
      $(e.currentTarget).hide();

      if (player.isPoweredDown())
        Meteor.call('togglePowerDown', player.gameId, function(error, powerState) {
          if (error)
            return alert(error.reason);
        });
      $(".playBtn").toggleClass("disabled", !allowSubmit());
    }
  },
  'click .played': function(e) {
    var player = Players.findOne({userId: Meteor.userId()});
    if (!player.submitted) {
      unchooseCard(this);
      $('.available.' + this.cardId).show();
      $(".playBtn").toggleClass("disabled", !allowSubmit());
    }
  },
  'click .empty': function(e) {
    var player = Players.findOne({userId: Meteor.userId()});
    if (!player.submitted) {
      Session.set("selectedSlot", this.slot);
    }
  }
});

Template.cards.events({
  'click .playBtn': function(e) {
    submitCards(this.game);
  },
  'click .powerBtn': function(e) {
    Meteor.call('togglePowerDown', this.game._id, function(error, powerState) {
      if (error)
        return alert(error.reason);
      if (powerState == GameLogic.OFF) {
        getChosenCards().forEach(function(item) {
          if (item.type !== 'empty')
            $('.available.' + item.cardId).show();
        });
        unchooseAllCards();
      }
      $(".playBtn").toggleClass("disabled", !allowSubmit());
    });
  }
});

function chooseCard(card) {
  var chosenCards = getChosenCards();
  var selectedSlot = getSlotIndex();
  chosenCards[selectedSlot] = card;

  var nextSlot = -1;
  for (var i=0;i<chosenCards.length;i++) {
    if (chosenCards[i].type === 'empty') {
      nextSlot = i;
      break;
    }
  }
  Session.set("chosenCnt", getChosenCnt()+1);
  Session.set("chosenCards", chosenCards);
  Session.set("selectedSlot", nextSlot);
}

function unchooseCard(card) {
  var chosenCards = getChosenCards();
  chosenCards[card.slot] = {type: 'empty', cardType: -1, slot:card.slot};
  Session.set("chosenCnt", getChosenCnt()-1);
  Session.set("chosenCards", chosenCards);
  Session.set("selectedSlot", card.slot);
}

function unchooseAllCards() {
  Session.set("chosenCnt", getLockedCnt());
  Session.set("chosenCards", emptySelection());
  Session.set("selectedSlot", 0);
}

function getChosenCnt() {
  return Session.get("chosenCnt") || getLockedCnt();
}

function getSlotIndex() {
  return Session.get("selectedSlot") || 0;
}

function getChosenCards() {
  return Session.get("chosenCards")|| emptySelection();
}

function getLockedCnt() {
  return Cards.findOne({userId: Meteor.userId()}).lockedCards.length;
}

function emptySelection() {
  var arr = Array.apply(null, new Array(5-getLockedCnt()));
  arr = arr.map(function (x, i) {
    return {cardType: -1, type:'empty', slot:i};
  });
  return arr;
}

function allowSubmit() {
  console.log("chosen cnt",getChosenCnt());
  var player = Players.findOne({userId: Meteor.userId()});
  return getChosenCnt() == 5 || player.isPoweredDown();
}

function submitCards(game) {
  var chosenCards = getChosenCards();
  console.log("submitting cards", chosenCards);
  $(document).find('.col-md-4.well').removeClass('countdown').removeClass('finish');
  Meteor.call('playCards', {gameId: game._id, cards: chosenCards}, function(error) {
    Session.set("chosenCnt", false);
    Session.set("chosenCards", false);
    Session.set("selectedSlot", 0);
    if (error)
      return alert(error.reason);
  });
}

function addUIData(cards, available) {
  cards.forEach(function(card, i) {
    if (card !== null && card.cardType !== -1) {
      card.slot = i;
      card.class = available ? 'available' : 'played';
      card.type = ['u', 'r', 'l', 'b', 'f1', 'f2', 'f3'][card.cardType];
    } else {
      card.type = 'empty';
      card.slot = i;
    }
  });
  return cards;
}
