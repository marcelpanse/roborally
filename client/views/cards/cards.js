var timerHandle = null;
Template.cards.helpers({
  player: function() {
    return Players.findOne({userId: Meteor.userId()});
  },
  otherPlayers: function() {
    return Players.find({gameId: this.game._id, userId: {$ne: Meteor.userId()}});
  },
  chosenCards: function() {
    return addUIData(this.chosenCards, false, getPlayer().lockedCnt(), true);
  },
  availableCards: function() {
    var cards = this.handCards;
    if (cards.length < 9) {
        //add empty cards^
        for (var j = cards.length; j < 9; j++) {
            cards.push(CardLogic.DAMAGE);
        }
    }
    return addUIData(cards, true, false,false);
  },
  showCards: function() {
    return (this.game.gamePhase == GameState.PHASE.PROGRAM &&
       getPlayer() && !getPlayer().submitted);
  },
  showPlayButton: function() {
    return !getPlayer().submitted;
  },
  timer: function() {
    if (this.game.timer === 1 && timerHandle === null) {
      $.titleAlert("Hurry up! 30 seconds left!", { duration: 2000 });

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
    if (timerHandle &&  Session.get("timeLeft") <= 5 && !getPlayer().submitted)  {
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
        var player = getPlayer();
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
    switch (getPlayer().powerState) {
      case GameLogic.OFF:
        return  'cancel power down';
      case GameLogic.DOWN:
        return  'cancel announce power down';
      case GameLogic.ON:
        return  'announce power down';
    }
  },
  ownPowerStateStyle: function() {
    switch (getPlayer().powerState) {
      case GameLogic.DOWN:
      case GameLogic.OFF:
        return  'btn-danger';
      case GameLogic.ON:
        return  'btn-warning';
    }
  },
  poweredDown: function() {
    return getPlayer().isPoweredDown();
  },
  lives: function() {
    l = [];
    for(var i=0;i<3;i++)
      if (i<getPlayer().lives)
        l.push('glyphicon-heart');
      else
        l.push('glyphicon-heart-empty');
    return l;
  },
  dmgPercentage: function() {
    return this.damage * 10;
  },
  headingForFinish: function() {
    return this.visited_checkpoints == this.board().checkpoints.length-1;
  },
  nextCheckpoint: function() {
    return this.visited_checkpoints+1;
  }
});

Template.card.helpers({
  emptyCard: function() {
    return this.type === 'empty';
  },
  dmgCard: function() {
    return this.type === 'dmg';
  },
  coveredCard: function() {
    return this.type === 'covered';
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

Template.playerStatus.helpers({
  playerName: function() {
    if (this.userId === Meteor.userId())
      return "Your robot";
    else
      return this.name;
  },
  cardsHtml: function() {
    return addUIData(this.cards || [], false, this.lockedCnt(), false);
  },
  lives: function() {
    l = [];
    for(var i=0;i<3;i++)
      if (i<this.lives)
        l.push('glyphicon-heart');
      else
        l.push('glyphicon-heart-empty');
    return l;
  },
  dmgPercentage: function() {
    return this.damage * 10;
  },
  power: function() {
    if (this.powerState == GameLogic.OFF)
      return 'powered down';
    else if (this.powerState == GameLogic.DOWN)
      return 'power down played';
  },
  headingForFinish: function() {
    return this.visited_checkpoints == this.board().checkpoints.length-1;
  },
  nextCheckpoint: function() {
    return Math.min(this.board().checkpoints.length, this.visited_checkpoints+1);
  },
  showSubmittedLabel: function() {
    return this.submitted && this.game().gamePhase == GameState.PHASE.PROGRAM;
  },
  showPoweredDownLabel: function() {
    return this.powerState == GameLogic.OFF &&
           (this.game().gamePhase != GameState.PHASE.PROGRAM || this.submitted);
  },
  powerDownPlayed: function() {
    return (this.powerState == GameLogic.DOWN);
  }

});

Template.card.events({
  'click .available': function(e) {
    var currentSlot = getSlotIndex();
    if ($(e.currentTarget).css("opacity") == 1 && isEmptySlot(currentSlot)) {
      $(e.currentTarget).css("opacity", "0.3");
      Session.set("selectedSlot", getNextEmptySlotIndex(currentSlot));

      var player = getPlayer();
      console.log('Chosen count: ', getChosenCnt());
      if (!player.submitted) {
        chooseCard(player.gameId, this.cardId, currentSlot);
        setEmptySlot(currentSlot, false);
        console.log("choose card ",this.cardId,' for slot ', getSlotIndex());

        if (player.isPoweredDown())
          Meteor.call('togglePowerDown', player.gameId, function(error, powerState) {
            if (error)
              return alert(error.reason);
            $(".playBtn").toggleClass("disabled", !allowSubmit());
          });
      } else {
        $(e.currentTarget).css("opacity", "1");
        Session.set("selectedSlot", currentSlot);
      }
    }

  },
  'click .played': function(e) {
    if (!isEmptySlot(this.slot) && this.class.indexOf("locked") == -1) {
      setEmptySlot(this.slot, true);
      var player = getPlayer();
      if (!player.submitted) {
        unchooseCard(player.gameId, this.slot);
        $('.available.' + this.cardId).css("opacity", "1");
        Session.set("selectedSlot", this.slot);
      } else {
        setEmptySlot(this.slot, false);
      }
    }
  },
  'click .empty': function(e) {
    if (!getPlayer().submitted) {
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
        this.chosenCards.forEach(function(item) {
          if (item.type !== 'empty')
            $('.available.' + item.cardId).show();
        });
        unchooseAllCards(getPlayer());
      }
      $(".playBtn").toggleClass("disabled", !allowSubmit());
    });
  }
});

function getPlayer() {
    return Players.findOne({userId: Meteor.userId()});
}

function chooseCard(gameId, card, slot) {
  Meteor.call('selectCard', gameId, card, slot, function(error, chosenCards) {
    if (error)
      return alert(error.reason);
    $(".playBtn").toggleClass("disabled", !allowSubmit());
  });
}

function unchooseCard(gameId, slot) {
  Meteor.call('deselectCard', gameId, slot, function(error, chosenCards) {
    if (error)
      return alert(error.reason);
    $(".playBtn").toggleClass("disabled", !allowSubmit());
  });
}

function unchooseAllCards(player) {
  Session.set("selectedSlot", 0);
  initEmptySlots();
  Meteor.call('deselectAllsCards', player.gameId, function(error) {
    if (error)
      return alert(error.reason);
  });
}

function getChosenCnt() {
  return getPlayer().chosenCardsCnt;
}

function getSlotIndex() {
  return Session.get("selectedSlot") || 0;
}

function initEmptySlots() {
  var emptySlots = [];
  var emptyCnt = GameLogic.CARD_SLOTS - getLockedCnt();
  for(var i=0;i<GameLogic.CARD_SLOTS;i++) {
    emptySlots.push(i < emptyCnt);
  }
  Session.set("emptySlots", emptySlots);
}

function getEmptySlots() {
  if (!Session.get("emptySlots")) {
    initEmptySlots();
  }
  return Session.get("emptySlots");
}

function isEmptySlot(index) {
  return getEmptySlots()[index];
}

function setEmptySlot(index, value) {
  var slots = getEmptySlots();
  slots[index] = value;
  Session.set("emptySlots", slots);
}

function getNextEmptySlotIndex(currentSlot) {
  var emptySlots = getEmptySlots();
  for (var j=currentSlot+1;j<currentSlot+GameLogic.CARD_SLOTS;j++)
    if (emptySlots[j%GameLogic.CARD_SLOTS])
      return j%GameLogic.CARD_SLOTS;
  return  0;
}

function getLockedCnt() {
  return getPlayer().lockedCnt();
}

function allowSubmit() {
  return getChosenCnt() == 5 || getPlayer().isPoweredDown();
}

function submitCards(game) {
  var chosenCards = this.chosenCards;
  console.log("submitting cards", chosenCards);
  $(document).find('.col-md-4.well').removeClass('countdown').removeClass('finish');
  Meteor.call('playCards',  game._id, function(error) {
    Session.set("selectedSlot", 0);
    Session.set("emptySlots",false);
    if (error)
      return alert(error.reason);
  });
}

function addUIData(cards, available, locked, selectable) {
  var playerCnt = getPlayer().game().playerCnt();
  var uiCards = [];
  cards.forEach(function(card, i) {
    var cardProp = {
      cardId: card,
    };
    if (selectable)
      cardProp.slot = i;
    switch (card) {
      case CardLogic.RANDOM:
        cardProp.type = 'random';
        break;
      case CardLogic.DAMAGE:
        cardProp.type = 'dmg';
        break;
      case CardLogic.COVERED:
        cardProp.type = 'covered';
        break;
      case CardLogic.EMPTY:
        cardProp.type = 'empty';
        break;
      default:
        if (card !== null) {
          cardProp.class = available ? 'available' : 'played';
          cardProp.priority = CardLogic.priority(card);
          if (locked && i >= GameLogic.CARD_SLOTS - locked) {
            cardProp.class += " locked";
            cardProp.locked = true;
          }
          cardProp.type = CardLogic.cardType(card, playerCnt).name;
        }
    }
    uiCards.push(cardProp);
  });
  return uiCards;
}
