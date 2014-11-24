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

  scope.drawCards = function(gameId, playerIndex) {
    var player = Games.findOne({_id: gameId}).players[playerIndex];
    if (player.cards === undefined) {
      player.cards = [];
    }
    var nrOfNewCards = _MAX_NUMBER_OF_CARDS - player.cards.length;

    var cards = player.cards;
    for (var j =0; j < nrOfNewCards; j++) {
      cards.push(_.random(Object.keys(_cardTypes).length-1));
    }

    var updatedPlayer = {};
    updatedPlayer['players.' + playerIndex + '.cards'] = cards;

    console.log('new cards', cards);

    Games.update(gameId, {$set: updatedPlayer});
  };

  scope.updatePosition = function(gameId, playerIndex, newX, newY, direction) {
    var player = {};
    player['players.' + playerIndex + '.position.x'] = newX;
    player['players.' + playerIndex + '.position.y'] = newY;
    player['players.' + playerIndex + '.direction'] = direction;

    Games.update(gameId, {$set: player});
  };

  scope.playCard = function(gameId, player, playerIndex, card, delay) {
    Meteor.setTimeout(function() {
      console.log('playing card', _cardTypes[card]);
      player.direction += _cardTypes[card].direction;
      player.direction = ((player.direction%4)+4)%4; //convert everything between 0-3
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
      GameLogic.updatePosition(gameId, playerIndex, player.position.x, player.position.y, player.direction);
    }, delay || 0);
  };

  scope.playCards = function(gameId, playerIndex, cards) {
    console.log('playing cards', cards);

    var game = Games.findOne({_id: gameId});
    var player = game.players[playerIndex];
    var playerCards = player.cards;

    for (var i in cards) {
      var card = cards[i];
      var index = playerCards.indexOf(card);
      if (index > -1) {
        GameLogic.playCard(gameId, player, playerIndex, card, i*1000);
        playerCards.splice(index, 1);
      }
    }

    var updatedPlayer = {};
    updatedPlayer['players.' + playerIndex + '.cards'] = playerCards;
    Games.update(gameId, {$set: updatedPlayer});

    GameLogic.drawCards(gameId, playerIndex);
  };
})(GameLogic);
