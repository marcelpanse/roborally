GameLogic = {
  UP: 0,
  RIGHT: 1,
  DOWN: 2,
  LEFT: 3
};

(function (scope) {
  var _MAX_NUMBER_OF_CARDS = 9;

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

  scope.playCard = function(player, card) {
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

    if (player.position.x < 0 || player.position.y < 0 ||
        player.position.x >= Tiles.BOARD_WIDTH || player.position.y >= Tiles.BOARD_HEIGHT) {
      //off the board, reset.
      var start = Tiles.getStartPosition(Players.find({gameId: player.gameId}).fetch());
      player.position.x = start.x;
      player.position.y = start.y;
      player.direction = start.direction;
    }

    GameLogic.updatePosition(player, player.position.x, player.position.y, player.direction);
    console.log('new position', player.position);
  };

  scope.submitCards = function(player, cards) {
    console.log('player ' + player.name + ' submitted cards: ' + cards);
    Players.update(player._id, {$set: {submittedCards: cards}});

    var submittedPlayers = Players.find({gameId: player.gameId, 'submittedCards.0': {$exists: true}}).fetch();
    if (submittedPlayers.length == 2) {
      GameState.nextGamePhase(player.gameId);
    }
  };
})(GameLogic);
