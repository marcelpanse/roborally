GameLogic = {};

(function (scope) {
  var MAX_NUMBER_OF_CARDS = 6;

  var _cardTypes = {
    STEP_FORWARD: {direction: 0, position: 1},
    STEP_BACKWARD: {direction: 0, position: -1},
    TURN_LEFT: {direction: -1, position: 0},
    TURN_RIGHT: {direction: 1, position: 0},
    STEP_FORWARD_2: {direction: 0, position: 2}
  };

  var UP = 0;
  var RIGHT = 1;
  var DOWN = 2;
  var LEFT = 3;

  scope.drawCards = function(gameId, playerIndex) {
    var player = Games.findOne({_id: gameId}).players[playerIndex];
    if (player.cards === undefined) {
      player.cards = [];
    }
    var nrOfNewCards = MAX_NUMBER_OF_CARDS - player.cards.length;

    var cards = player.cards;
    for (var j =0; j < nrOfNewCards; j++) {
      cards.push(_.random(Object.keys(_cardTypes).length));
    }

    var updatedPlayer = {};
    updatedPlayer['players.' + playerIndex + '.cards'] = cards;
    Games.update(gameId, {$set: updatedPlayer});
  };

  scope.updatePosition = function(gameId, playerIndex) {
    var player = {};
    player['players.' + playerIndex + '.position.x'] = 7;
    player['players.' + playerIndex + '.position.y'] = 0;

    Games.update(gameId, {$set: player});
  };

  scope.playCards = function(gameId, playerIndex, cards) {
    var playerCards = Games.findOne({_id: gameId}).players[playerIndex].cards;
    console.log(cards);
    console.log(playerCards);
    for (var i in cards) {
      var index = playerCards.indexOf(cards[i]);
      if (index > -1) {
        playerCards.splice(index, 1);
      }
      console.log(playerCards);
    }

    var updatedPlayer = {};
    updatedPlayer['players.' + playerIndex + '.cards'] = playerCards;
    Games.update(gameId, {$set: updatedPlayer});

    GameLogic.drawCards(gameId, playerIndex);
  };
})(GameLogic);
