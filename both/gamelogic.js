GameLogic = {
  DEFAULT_DIRECTION: 2,
  DEFAULT_X: 0,
  DEFAULT_Y: 7,
  UP: 0,
  RIGHT: 1,
  DOWN: 2,
  LEFT: 3
};

(function (scope) {
  var _MAX_NUMBER_OF_CARDS = 6;

  var _cardTypes = {
    0: {direction: 0, position: 1, name: "STEP_FORWARD"},
    1: {direction: 0, position: -1, name: "STEP_BACKWARD"},
    2: {direction: -1, position: 0, name: "TURN_LEFT"},
    3: {direction: 1, position: 0, name: "TURN_RIGHT"},
    4: {direction: 0, position: 2, name: "STEP_FORWARD_2"},
    5: {direction: 0, position: 3, name: "STEP_FORWARD_3"},
    6: {direction: 2, position: 0, name: "U_TURN"}
  };

  scope.drawCards = function(player) {
    var cardObj = Cards.findOne({playerId: player._id});
    var id;
    if (!cardObj) {
      cardObj = {gameId: player.gameId, playerId: player._id, userId: player.userId, cards: []};
      id = Cards.insert(cardObj);
    } else {
      id = cardObj._id;
    }
    var nrOfNewCards = _MAX_NUMBER_OF_CARDS - cardObj.cards.length;
    var cards = cardObj.cards || [];

    for (var j =0; j < nrOfNewCards; j++) {
      cards.push(_.random(Object.keys(_cardTypes).length-1));
    }

    console.log('new cards', cards);
    Cards.update(id, {$set: {cards: cards}});
  };

  scope.updatePosition = function(player, newX, newY, direction) {
    var attrs = {
      position: {
        x: newX,
        y: newY
      },
      direction: direction
    };

    Players.update(player._id, {$set: attrs});
  };

  scope.playCard = function(player, card, delay) {
    Meteor.setTimeout(function() {
      console.log('playing card', _cardTypes[card]);
      player.direction += _cardTypes[card].direction;
      player.direction = ((player.direction%4)+4)%4; //convert everything to between 0-3
      switch (player.direction) {
        case GameLogic.UP:
          player.position.y -= _cardTypes[card].position;
          break;
        case GameLogic.RIGHT:
          player.position.x += _cardTypes[card].position;
          break;
        case GameLogic.DOWN:
          player.position.y += _cardTypes[card].position;
          break;
        case GameLogic.LEFT:
          player.position.x -= _cardTypes[card].position;
          break;
      }
      GameLogic.updatePosition(player, player.position.x, player.position.y, player.direction);
    }, delay || 0);
  };

  scope.playCards = function(player, cards) {
    console.log('playing cards', cards);

    var cardObj = Cards.findOne({playerId: player._id});
    var playerCards = cardObj.cards;

    for (var i in cards) {
      var card = cards[i];
      var index = playerCards.indexOf(card);
      if (index > -1) {
        GameLogic.playCard(player, card, i*1000);
        playerCards.splice(index, 1);
      }
    }

    Cards.update(cardObj._id, {$set: {cards: cards}});
    GameLogic.drawCards(player);
  };
})(GameLogic);
