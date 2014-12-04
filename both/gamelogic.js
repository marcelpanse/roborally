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

    for (var j = 0; j < nrOfNewCards; j++) {
      cards.push(_.random(Object.keys(_cardTypes).length-1));
    }

    console.log('player ' + player.name + ' has new cards', cards);
    Cards.update(id, {$set: {cards: cards}});
  };

  scope.submitCards = function(player, cards) {
    console.log('player ' + player.name + ' submitted cards: ' + cards);
    Players.update(player._id, {$set: {submittedCards: cards}});

    var availableCards = Cards.findOne({playerId: player._id}).cards;
    for (var i in cards) {
      for (var j = 0; j < availableCards.length; j++) {
        if (cards[i] == availableCards[j]) {
          availableCards.splice(j, 1);
          break;
        }
      }
    }
    Cards.update({playerId: player._id}, {$set: {cards: availableCards}});

    var submittedPlayers = Players.find({gameId: player.gameId, 'submittedCards.0': {$exists: true}}).fetch();
    if (submittedPlayers.length == 2) {
      GameState.nextGamePhase(player.gameId);
    }
  };

  scope.playCard = function(gameId, playerId, callback) {
    var players = Players.find({gameId: gameId}).fetch();
    var player = _.find(players, function(item) {
      return item._id == playerId;
    });
    console.log("trying to play next card for player " + player.name);
    var submittedCards = player.submittedCards;
    var card = submittedCards.shift();
    Players.update(player._id, {$set: {submittedCards: submittedCards}});

    if (card !== undefined) {
      var cardType = _cardTypes[card];
      console.log('playing card', cardType, player);

      player.direction += cardType.direction;
      player.direction = ((player.direction%4)+4)%4; //convert everything to between 0-3

      if (cardType.position === 0) {
        Meteor.wrapAsync(checkRespawnsAndUpdateDb)(players, player);
      } else {
        var step = Math.min(cardType.position, 1);
        for (var i = 0; i < Math.abs(cardType.position); i++) {
          switch (player.direction) {
            case GameLogic.UP:
              playerOnTile = Tiles.isPlayerOnTile(players, player.position.x, player.position.y - step);
              if (playerOnTile !== null) {
                playerOnTile.position.y -= step;
              }
              player.position.y -= step;
              break;
            case GameLogic.RIGHT:
              playerOnTile = Tiles.isPlayerOnTile(players, player.position.x + step, player.position.y);
              if (playerOnTile !== null) {
                playerOnTile.position.x += step;
              }
              player.position.x += step;
              break;
            case GameLogic.DOWN:
              playerOnTile = Tiles.isPlayerOnTile(players, player.position.x, player.position.y + step);
              if (playerOnTile !== null) {
                playerOnTile.position.y += step;
              }
              player.position.y += step;
              break;
            case GameLogic.LEFT:
              playerOnTile = Tiles.isPlayerOnTile(players, player.position.x - step, player.position.y);
              if (playerOnTile !== null) {
                playerOnTile.position.x -= step;
              }
              player.position.x -= step;
              break;
          }
          if (Meteor.wrapAsync(checkRespawnsAndUpdateDb)(players, player)) {
            break; //player respawned, don't continue playing out this card.
          }
        }
      }
    } else {
      console.log("card is not playable " + card + " player " + player.name);
    }
    callback();
  };

  function checkRespawnsAndUpdateDb(players, player, callback) {
    Meteor.setTimeout(function() {
      var respawned = false;
      for (var j in players) {
        var playerToUpdate = players[j];
        if (!Tiles.isPlayerOnBoard(playerToUpdate) || Tiles.isPlayerOnVoid(playerToUpdate)) {
          if (player._id === playerToUpdate._id) {
            respawned = true;
          }
          playerToUpdate.submittedCards = [];
          Players.update(playerToUpdate._id, playerToUpdate);
          console.log("updating position", playerToUpdate.name);
          Meteor.wrapAsync(respawnPlayerWithDelay)(players, playerToUpdate);
        } else {
          console.log("updating position", playerToUpdate.name);
          Players.update(playerToUpdate._id, playerToUpdate);
        }
      }
      callback(null, respawned);
    }, 300);
  }

  function respawnPlayerWithDelay(players, player, callback) {
    Meteor.setTimeout(function() {
      //respawn if player off board or on void-tile
      var start = Tiles.getStartPosition(players);
      player.position.x = start.x;
      player.position.y = start.y;
      player.direction = start.direction;
      console.log("respawning player", player.name);
      Players.update(player._id, player);
      callback();
    }, 500); //wait before respawning, so you can see the player stepping into the void
  }
})(GameLogic);
