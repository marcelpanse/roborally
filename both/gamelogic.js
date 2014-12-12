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

  scope.makeDeck = function(game) {
    var current = Deck.findOne({gameId: game._id});
    if (!current || current.cards.length < 10) {
      Deck.upsert({gameId: game._id}, {$set: {cards: _.shuffle(_deck)}});
    }
  };

  scope.dealCards = function(player) {
    var deck = Deck.findOne({gameId: player.gameId});
    var cardObj = Cards.findOne({playerId: player._id});
    if (!cardObj) {
      cardObj = {gameId: player.gameId, playerId: player._id, userId: player.userId, cards: []};
    }
    var cards = cardObj.cards || [];
    var nrOfNewCards = _MAX_NUMBER_OF_CARDS - cards.length;

    for (var j = 0; j < nrOfNewCards; j++) {
      var cardFromDeck = deck.cards.splice(_.random(0, deck.cards.length-1), 1)[0];
      cards.push({cardId: Meteor.uuid(), cardType: cardFromDeck.cardType, priority: cardFromDeck.priority});
    }

    console.log('player ' + player.name + ' has new cards', cards);
    Cards.upsert({playerId: player._id}, cardObj);
    Deck.update(deck._id, deck);
  };

  scope.submitCards = function(player, cards) {
    console.log('player ' + player.name + ' submitted cards: ' + cards);
    Players.update(player._id, {$set: {submittedCards: cards}});

    var availableCards = Cards.findOne({playerId: player._id}).cards;
    for (var i in cards) {
      for (var j = 0; j < availableCards.length; j++) {
        if (cards[i].cardId == availableCards[j].cardId) {
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

  scope.playCard = function(gameId, playerId, card, callback) {
    var players = Players.find({gameId: gameId}).fetch();
    var player = _.find(players, function(item) {
      return item._id == playerId;
    });
    console.log("trying to play next card for player " + player.name);

    if (card !== undefined) {
      var cardType = _cardTypes[card.cardType];
      console.log('playing card ' + cardType.name + ' for player ' + player.name);

      player.direction += cardType.direction;
      player.direction = ((player.direction%4)+4)%4; //convert everything to between 0-3

      if (cardType.position === 0) {
        Meteor.wrapAsync(checkRespawnsAndUpdateDb)(players, player);
      } else {
        var step = Math.min(cardType.position, 1);
        for (var i = 0; i < Math.abs(cardType.position); i++) {
          executeStep(players, player, step);
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

  scope.executeRollers = function(players, callback) {
    players.forEach(function(player) {
      //check if is on roller
      var tile = Tiles.getBoardTile(player.position.x, player.position.y);
      if (tile.tileType == Tiles.ROLLER) {
        //move player 1 step in roller direction
        //check if target pos is occupied and not on roller.
        switch (tile.elementDirection) {
          case "up":
            if (!Tiles.isPlayerOnTile(players, player.position.x, player.position.y-1)) {
              player.position.y -= 1;
            }
            break;
          case "right":
            if (!Tiles.isPlayerOnTile(players, player.position.x+1, player.position.y)) {
              player.position.x += 1;
            }
            break;
          case "down":
            if (!Tiles.isPlayerOnTile(players, player.position.x, player.position.y+1)) {
              player.position.y += 1;
            }
            break;
          case "left":
            if (!Tiles.isPlayerOnTile(players, player.position.x-1, player.position.y)) {
              player.position.x -= 1;
            }
            break;
        }
      }
      //check void's
      checkRespawnsAndUpdateDb(players, player);
    });
    callback();
  };

  function executeStep(players, player, step) {
    switch (player.direction) {
      case GameLogic.UP:
        if (Tiles.canMove(player.position.x, player.position.y, player.position.x, player.position.y - step)) {
          playerOnTile = Tiles.isPlayerOnTile(players, player.position.x, player.position.y - step);
          if (playerOnTile !== null) {
            if (Tiles.canMove(playerOnTile.position.x, playerOnTile.position.y, playerOnTile.position.x, playerOnTile.position.y - step)) {
              playerOnTile.position.y -= step;
              player.position.y -= step;
            }
          } else {
            player.position.y -= step;
          }
        }
        break;
      case GameLogic.RIGHT:
        if (Tiles.canMove(player.position.x, player.position.y, player.position.x + step, player.position.y)) {
          playerOnTile = Tiles.isPlayerOnTile(players, player.position.x + step, player.position.y);
          if (playerOnTile !== null) {
            if (Tiles.canMove(playerOnTile.position.x, playerOnTile.position.y, playerOnTile.position.x + step, playerOnTile.position.y)) {
              playerOnTile.position.x += step;
              player.position.x += step;
            }
          } else {
            player.position.x += step;
          }
        }
        break;
      case GameLogic.DOWN:
        if (Tiles.canMove(player.position.x, player.position.y, player.position.x, player.position.y + step)) {
          playerOnTile = Tiles.isPlayerOnTile(players, player.position.x, player.position.y + step);
          if (playerOnTile !== null) {
            if (Tiles.canMove(playerOnTile.position.x, playerOnTile.position.y, playerOnTile.position.x, playerOnTile.position.y + step)) {
              playerOnTile.position.y += step;
              player.position.y += step;
            }
          } else {
            player.position.y += step;
          }
        }
        break;
      case GameLogic.LEFT:
        if (Tiles.canMove(player.position.x, player.position.y, player.position.x - step, player.position.y)) {
          playerOnTile = Tiles.isPlayerOnTile(players, player.position.x - step, player.position.y);
          if (playerOnTile !== null) {
            if (Tiles.canMove(playerOnTile.position.x, playerOnTile.position.y, playerOnTile.position.x - step, playerOnTile.position.y)) {
              playerOnTile.position.x -= step;
              player.position.x -= step;
            }
          } else {
            player.position.x -= step;
          }
        }
        break;
    }
  }

  function checkRespawnsAndUpdateDb(players, player, callback) {
    Meteor.setTimeout(function() {
      var respawned = false;
      players.forEach(function(playerToUpdate) {
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
      });
      if (callback) {
        callback(null, respawned);
      }
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

  var _deck = [
    { priority: 10, cardType: 6 },
    { priority: 20, cardType: 6, },
    { priority: 30, cardType: 6, },
    { priority: 40, cardType: 6, },
    { priority: 50, cardType: 6, },
    { priority: 60, cardType: 6, },
    { priority: 70, cardType: 2 },
    { priority: 80, cardType: 3 },
    { priority: 90, cardType: 2 },
    { priority: 100, cardType: 3 },
    { priority: 110, cardType: 2 },
    { priority: 120, cardType: 3 },
    { priority: 130, cardType: 2 },
    { priority: 140, cardType: 3 },
    { priority: 150, cardType: 2 },
    { priority: 160, cardType: 3 },
    { priority: 170, cardType: 2 },
    { priority: 180, cardType: 3 },
    { priority: 190, cardType: 2 },
    { priority: 200, cardType: 3 },
    { priority: 210, cardType: 2 },
    { priority: 220, cardType: 3 },
    { priority: 230, cardType: 2 },
    { priority: 240, cardType: 3 },
    { priority: 250, cardType: 2 },
    { priority: 260, cardType: 3 },
    { priority: 270, cardType: 2 },
    { priority: 280, cardType: 3 },
    { priority: 290, cardType: 2 },
    { priority: 300, cardType: 3 },
    { priority: 310, cardType: 2 },
    { priority: 320, cardType: 3 },
    { priority: 330, cardType: 2 },
    { priority: 340, cardType: 3 },
    { priority: 350, cardType: 2 },
    { priority: 360, cardType: 3 },
    { priority: 370, cardType: 2 },
    { priority: 380, cardType: 3 },
    { priority: 390, cardType: 2 },
    { priority: 400, cardType: 3 },
    { priority: 410, cardType: 2 },
    { priority: 420, cardType: 3 },
    { priority: 430, cardType: 1 },
    { priority: 440, cardType: 1 },
    { priority: 450, cardType: 1 },
    { priority: 460, cardType: 1 },
    { priority: 470, cardType: 1 },
    { priority: 480, cardType: 1 },
    { priority: 490, cardType: 0 },
    { priority: 500, cardType: 0 },
    { priority: 510, cardType: 0 },
    { priority: 520, cardType: 0 },
    { priority: 530, cardType: 0 },
    { priority: 540, cardType: 0 },
    { priority: 550, cardType: 0 },
    { priority: 560, cardType: 0 },
    { priority: 570, cardType: 0 },
    { priority: 580, cardType: 0 },
    { priority: 590, cardType: 0 },
    { priority: 600, cardType: 0 },
    { priority: 610, cardType: 0 },
    { priority: 620, cardType: 0 },
    { priority: 630, cardType: 0 },
    { priority: 640, cardType: 0 },
    { priority: 650, cardType: 0 },
    { priority: 660, cardType: 0 },
    { priority: 670, cardType: 4 },
    { priority: 680, cardType: 4 },
    { priority: 690, cardType: 4 },
    { priority: 700, cardType: 4 },
    { priority: 710, cardType: 4 },
    { priority: 720, cardType: 4 },
    { priority: 730, cardType: 4 },
    { priority: 740, cardType: 4 },
    { priority: 750, cardType: 4 },
    { priority: 760, cardType: 4 },
    { priority: 770, cardType: 4 },
    { priority: 780, cardType: 4 },
    { priority: 790, cardType: 5 },
    { priority: 800, cardType: 5 },
    { priority: 810, cardType: 5 },
    { priority: 820, cardType: 5 },
    { priority: 830, cardType: 5 },
    { priority: 840, cardType: 5 }
  ];
})(GameLogic);
