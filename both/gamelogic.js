GameLogic = {
  UP: 0,
  RIGHT: 1,
  DOWN: 2,
  LEFT: 3,
  TIMER: 30,
  CARD_SLOTS: 5
};

(function (scope) {
  var _MAX_NUMBER_OF_CARDS = 9;
  var _CARD_PLAY_DELAY = 500;

  var _cardTypes = {
    0: {direction: 2, position: 0, name: "U_TURN"},
    1: {direction: 1, position: 0, name: "TURN_RIGHT"},
    2: {direction: -1, position: 0, name: "TURN_LEFT"},
    3: {direction: 0, position: -1, name: "STEP_BACKWARD"},
    4: {direction: 0, position: 1, name: "STEP_FORWARD"},
    5: {direction: 0, position: 2, name: "STEP_FORWARD_2"},
    6: {direction: 0, position: 3, name: "STEP_FORWARD_3"}
  };

  scope.makeDeck = function(game) {
    var current = Deck.findOne({gameId: game._id});
    //create/shuffle new deck (cards are returned from hands)
    Deck.upsert({gameId: game._id}, {$set: {cards: _.shuffle(_deck)}});
  };

  scope.dealCards = function(player) {
    var deck = Deck.findOne({gameId: player.gameId});
    var cardObj = Cards.findOne({playerId: player._id});
    if (!cardObj) {
      cardObj = {gameId: player.gameId, playerId: player._id, userId: player.userId, cards: []};
    }
    var cards = cardObj.cards || [];
    var maxCards = (_MAX_NUMBER_OF_CARDS - player.damage);
    var nrOfNewCards = maxCards - cards.length;

    for (var j = 0; j < nrOfNewCards; j++) {
      var cardFromDeck = deck.cards.splice(_.random(0, deck.cards.length-1), 1)[0]; //grab card from deck, so it can't be handed out twice
      cards.push({cardId: Meteor.uuid(), cardType: cardFromDeck.cardType, priority: cardFromDeck.priority});
    }

    console.log('player ' + player.name + ' has new cards', cards);
    Cards.upsert({playerId: player._id}, cardObj);
    Deck.update(deck._id, deck);
  };

  scope.submitCards = function(player, cards) {
    console.log('player ' + player.name + ' submitted cards: ' + cards);

    //check if all played cards are available from original hand...
    var availableCards = Cards.findOne({playerId: player._id}).cards;
    for (var i = cards.length-1; i >= 0; i--) {
      var found = false;
      for (var j = 0; j < availableCards.length; j++) {
        if (cards[i].cardId == availableCards[j].cardId) {
          availableCards.splice(j, 1);
          found = true;
          break;
        }
      }
      if (!found) {
        console.log("illegal card detected! (removing card)");
        cards.splice(i, 1);
      }
    }

    if (cards.length < GameLogic.CARD_SLOTS) {
      console.log("Not enough cards submitted");
      var nrOfNewCards = GameLogic.CARD_SLOTS - cards.length;
      for (var q = 0; q < nrOfNewCards; q++) {
        var cardFromHand = availableCards.splice(_.random(0, availableCards.length-1), 1)[0]; //grab card from hand
        console.log("Handing out random card", cardFromHand);
        cards.push({cardId: Meteor.uuid(), cardType: cardFromHand.cardType, priority: cardFromHand.priority});
      }
    }

    Players.update(player._id, {$set: {submittedCards: cards, submitted: true}});
    Cards.update({playerId: player._id}, {$set: {cards: availableCards}});
    
    var playerCnt = Players.find({gameId: player.gameId}).count();
    var readyPlayerCnt = Players.find({gameId: player.gameId, submitted: true}).count();
    if (readyPlayerCnt = playerCnt) {
      Games.update(player.gameId, {$set: {timer: -1}});
      GameState.nextGamePhase(player.gameId);
    } else if (readyPlayerCnt == playerCnt-1) {
      //start timer
      Games.update(player.gameId, {$set: {timer: 1}});
      Meteor.setTimeout(function() {
        if (Games.findOne(player.gameId).timer === 1) {
          console.log("time up! setting timer to 0");
          Games.update(player.gameId, {$set: {timer: 0}});

          //wait for player to auto-submit selected cards..
          Meteor.setTimeout(function() {
            //if nothing happened the system to should auto-submit random cards..
            if (Players.find({gameId: player.gameId, submitted: true}).count() == 1) {
              var unsubmittedPlayer = Players.findOne({gameId: player.gameId, submitted: false});
              GameLogic.submitCards(unsubmittedPlayer, []);
              console.log("Player " + unsubmittedPlayer.name + " did not respond, submitting random cards");
            }
          }, 2500);
        }
      }, GameLogic.TIMER * 1000);
    }
  };

  scope.playCard = function(gameId, playerId, card, callback) {
    var players = Players.find({gameId: gameId}).fetch();
    var playerNum = -1;
    for(var i=0; playerNum==-1 && i<players.length; ++i) {
      if(players[i]._id === playerId)
        playerNum=i;
    }
    console.log("trying to play next card for player " + players[playerNum].name);

    if (card !== undefined) {
      var cardType = _cardTypes[card.cardType];
      console.log('playing card ' + cardType.name + ' for player ' + players[playerNum].name);

      players[playerNum].direction += cardType.direction;
      players[playerNum].direction = ((players[playerNum].direction%4)+4)%4; //convert everything to between 0-3

      if (cardType.position === 0) {
        Meteor.wrapAsync(checkRespawnsAndUpdateDb)(players, playerNum, _CARD_PLAY_DELAY);
      } else {
        var step = Math.min(cardType.position, 1);
        for (var i = 0; i < Math.abs(cardType.position); i++) {
          executeStep(players, players[playerNum], step);
          var timeout = i+1 < Math.abs(cardType.position) ? 0 : _CARD_PLAY_DELAY; //don't delay if there is another step to execute
          if (Meteor.wrapAsync(checkRespawnsAndUpdateDb)(players, playerNum, timeout)) {
            break; //players[playerNum] respawned, don't continue playing out this card.
          }
        }
      }
    } else {
      console.log("card is not playable " + card + " player " + players[playerNum].name);
    }
    callback();
  };


  scope.tryToMovePlayersOnRollers = function(players, moves) {  
    var move_canceled = true;
    while (move_canceled) {  // if a move was canceled we have to check for other conflicts again
      move_canceled = false;
      for (var i=0;i<moves.length;++i) {
        for (var j=i+1;j<moves.length;++j) {
          if (moves[i].x === moves[j].x && moves[i].y === moves[j].y) {
            moves[i].canceled = true;
            moves[j].canceled = true;
            moves[i].x = moves[i].player.position.x;
            moves[j].x = moves[j].player.position.x;
            moves[i].y = moves[i].player.position.y;
            moves[j].y = moves[j].player.position.y;
            move_canceled = true;
          }
        }
      }
    }
    for (var i in moves) {
      var move = moves[i];
      if (!move.canceled) {
        //move player 1 step in roller direction and rotate
        move.player.position.x = move.x;
        move.player.position.y = move.y;
        move.player.direction  = move.tile.rotate;
        move.player.direction %= 4;
        checkRespawnsAndUpdateDb(players, move.player, _CARD_PLAY_DELAY);
      }
    }
  };
  
  scope.executeRollers = function(players, callback) {
    var game = Games.findOne(players[0].gameId);
    var roller_moves = [];
    players.forEach(function(player) {
      //check if is on roller
      var tile = Tiles.getBoardTile(player.position.x, player.position.y,players.length,game.name);
      if (tile.tileType === Tiles.ROLLER) {
        roller_moves.push({player: player, x: player.position.x+tile.move.x, y: player.position.y+tile.move.y, tile: tile, canceled: false});
      } else {
        roller_moves.push({player: player, x: player.position.x, y: player.position.y, canceled: true});  // to detect conflicts add non-moving players
      }
    });
    scope.tryToMovePlayersOnRollers(players, roller_moves);
    callback();
  };
  
  // move players 2nd step in roller direction; 1st step is done by executeRollers, 
  scope.executeExpressRollers = function(players, callback) {
    var game = Games.findOne(players[0].gameId);
    var roller_moves = [];
    players.forEach(function(player) {
      //check if is on roller
      var tile = Tiles.getBoardTile(player.position.x, player.position.y,players.length,game.name);
      if (tile.tileType === Tiles.ROLLER && tile.speed === 2) {
        GameLogic.movePlayerWithRoller(player, players, tile);
      }
    });
    scope.tryToMovePlayersOnRollers(players, roller_moves);
    callback();
  }
  
  scope.executeGears = function(players, callback) {
    var game = Games.findOne(players[0].gameId);
    players.forEach(function(player) {
      var tile = Tiles.getBoardTile(player.position.x, player.position.y,players.length,game.name);
      if (tile.tileType === Tiles.GEAR) {
        player.direction = tile.rotate;
        player.direction %= 4;
        checkRespawnsAndUpdateDb(players, player, _CARD_PLAY_DELAY);
      }
    });
    callback();
  }
  
  scope.executePushers = function(players, callback) {
    var game = Games.findOne(players[0].gameId);
    players.forEach(function(player) {
      var tile = Tiles.getBoardTile(player.position.x, player.position.y,players.length,game.name);
      if (tile.tileType === Tiles.PUSHER &&  game.playPhaseCount % 2 === tile.pusher_type ) {
        tryToMovePlayer(players, player, tile.move, game);
        checkRespawnsAndUpdateDb(players, player, _CARD_PLAY_DELAY);
      }
    });
    callback();
  }
  
  scope.executeLasers = function(players, callback) {
    var game = Games.findOne(players[0].gameId);
    players.forEach(function(player) {
      var tile = Tiles.getBoardTile(player.position.x, player.position.y,players.length,game.name);
      if (tile.damage > 0) {
        player.damage += tile.damage;
        checkRespawnsAndUpdateDb(players, player, _CARD_PLAY_DELAY);
      }
      if (!player.powered_down) {
        scope.shootRobotLaser(players, player, players.length, game.name);
      }
    });
    callback();
  }
  
  scope.shootRobotLaser = function(players, player, playerCount, boardName ) {
    var stepY = 0;
    var stepX = 0;
    var wallDir = [];
    switch (player.direction) {
      case GameLogic.UP:
        stepY = -1;
        wallDir = ['up','down'];
        break;
      case GameLogic.RIGHT:
        wallDir = ['right','left'];
        stepX = 1;
        break;
      case GameLogic.DOWN:
        stepY = 1;
        wallDir = ['down','up'];
        break;
      case GameLogic.LEFT:
        wallDir = ['left','right'];
        stepX = -1;
        break;
    }
    var x = player.position.x;
    var y = player.position.y;
    while (x+stepX > 0 && y+stepY > 0 && x+stepX < Tiles.BOARD_WIDTH && y+stepY < Tiles.BOARD_HEIGHT && 
          !Tiles.hasWall(x,y, wallDir[0], playerCount, boardName) && !Tiles.hasWall(x+stepX,y+stepY, wallDir[1],playerCount, boardName)) {
      x += stepX;
      y += stepY;
      var victim = Tiles.isPlayerOnTile(players,x,y);
      if (victim) {
        victim.damage += 1;
        checkRespawnsAndUpdateDb(players, victim, _CARD_PLAY_DELAY);
        break;
      }
    }
  }
  
  function executeStep(players, player, step) {
    var game = Games.findOne(player.gameId);
    var stepX = 0;
    var stepY = 0;
    switch (player.direction) {
      case GameLogic.UP:
        stepY = -1;
        break;
      case GameLogic.RIGHT:
        stepX = 1;
        break;
      case GameLogic.DOWN:
        stepY = 1;
        break;
      case GameLogic.LEFT:
        stepX = -1;
        break;
    }
    tryToMovePlayer(players, player, {x:stepX, y:stepY}, game)  
  }
  
  function tryToMovePlayer(players, player, move, game) {
    if (move.x != 0 || move.y != 0) {
      if (Tiles.canMove(player.position.x, player.position.y, player.position.x + move.x, player.position.y + move.y,players.length,game.name)) {
        playerOnTile = Tiles.isPlayerOnTile(players, player.position.x + move.x, player.position.y + move.y);
        if (playerOnTile !== null) {
          if (Tiles.canMove(playerOnTile.position.x, playerOnTile.position.y, playerOnTile.position.x + move.x, playerOnTile.position.y + move.y,players.length,game.name)) {
            playerOnTile.position.y += move.y;
            playerOnTile.position.x += move.x;
            player.position.y += move.y;
            player.position.x += move.x;
          }
        } else {
          player.position.y += move.y;
          player.position.x += move.x;
        }
      }
    }
  }
  

  function checkRespawnsAndUpdateDb(players, playerNum, timeout, callback) {
    Meteor.setTimeout(function() {
      var respawned = false;
      for (var i in players) {
        if (!Tiles.isPlayerOnBoard(players[i]) || Tiles.isPlayerOnVoid(players[i],players)) {
          if (players[playerNum]._id === players[i]._id) {
            respawned = true;
          }
          players[i].submittedCards = [];
          players[i].damage = 2;
          players[i].lives--;
          Players.update(players[i]._id, players[i]);
          console.log("updating position", players[i].name);

          Chat.insert({
            gameId: players[playerNum].gameId,
            message: players[playerNum].name + ' died and got re-assembled! (lives: '+ players[playerNum].lives +', damage: '+ players[playerNum].damage +')',
            submitted: new Date().getTime()
          });

          Meteor.wrapAsync(respawnPlayerWithDelay)(players, playerNum);
        } else {
          console.log("updating position", players[i].name);
          Players.update(players[i]._id, players[i]);
        }
      };
      if (callback) {
        callback(null, respawned);
      }
    }, timeout);
  }
  
  function respawnPlayerWithDelay(players, playerNum, callback) {
    Meteor.setTimeout(function() {
      //respawn if player off board or on void-tile
      var start = Tiles.getStartPosition(players,playerNum);
      player.position.x = start.x;
      player.position.y = start.y;
      player.direction = start.direction;
      console.log("respawning player", player.name);
      Players.update(player._id, player);
      callback();
    }, _CARD_PLAY_DELAY); //wait before respawning, so you can see the player stepping into the void
  }

  var _deck = [
    { priority: 10, cardType: 0 },
    { priority: 20, cardType: 0, },
    { priority: 30, cardType: 0, },
    { priority: 40, cardType: 0, },
    { priority: 50, cardType: 0, },
    { priority: 60, cardType: 0, },
    { priority: 70, cardType: 2 },
    { priority: 80, cardType: 1 },
    { priority: 90, cardType: 2 },
    { priority: 100, cardType: 1 },
    { priority: 110, cardType: 2 },
    { priority: 120, cardType: 1 },
    { priority: 130, cardType: 2 },
    { priority: 140, cardType: 1 },
    { priority: 150, cardType: 2 },
    { priority: 160, cardType: 1 },
    { priority: 170, cardType: 2 },
    { priority: 180, cardType: 1 },
    { priority: 190, cardType: 2 },
    { priority: 200, cardType: 1 },
    { priority: 210, cardType: 2 },
    { priority: 220, cardType: 1 },
    { priority: 230, cardType: 2 },
    { priority: 240, cardType: 1 },
    { priority: 250, cardType: 2 },
    { priority: 260, cardType: 1 },
    { priority: 270, cardType: 2 },
    { priority: 280, cardType: 1 },
    { priority: 290, cardType: 2 },
    { priority: 300, cardType: 1 },
    { priority: 310, cardType: 2 },
    { priority: 320, cardType: 1 },
    { priority: 330, cardType: 2 },
    { priority: 340, cardType: 1 },
    { priority: 350, cardType: 2 },
    { priority: 360, cardType: 1 },
    { priority: 370, cardType: 2 },
    { priority: 380, cardType: 1 },
    { priority: 390, cardType: 2 },
    { priority: 400, cardType: 1 },
    { priority: 410, cardType: 2 },
    { priority: 420, cardType: 1 },
    { priority: 430, cardType: 3 },
    { priority: 440, cardType: 3 },
    { priority: 450, cardType: 3 },
    { priority: 460, cardType: 3 },
    { priority: 470, cardType: 3 },
    { priority: 480, cardType: 3 },
    { priority: 490, cardType: 4 },
    { priority: 500, cardType: 4 },
    { priority: 510, cardType: 4 },
    { priority: 520, cardType: 4 },
    { priority: 530, cardType: 4 },
    { priority: 540, cardType: 4 },
    { priority: 550, cardType: 4 },
    { priority: 560, cardType: 4 },
    { priority: 570, cardType: 4 },
    { priority: 580, cardType: 4 },
    { priority: 590, cardType: 4 },
    { priority: 600, cardType: 4 },
    { priority: 610, cardType: 4 },
    { priority: 620, cardType: 4 },
    { priority: 630, cardType: 4 },
    { priority: 640, cardType: 4 },
    { priority: 650, cardType: 4 },
    { priority: 660, cardType: 4 },
    { priority: 670, cardType: 5 },
    { priority: 680, cardType: 5 },
    { priority: 690, cardType: 5 },
    { priority: 700, cardType: 5 },
    { priority: 710, cardType: 5 },
    { priority: 720, cardType: 5 },
    { priority: 730, cardType: 5 },
    { priority: 740, cardType: 5 },
    { priority: 750, cardType: 5 },
    { priority: 760, cardType: 5 },
    { priority: 770, cardType: 5 },
    { priority: 780, cardType: 5 },
    { priority: 790, cardType: 6 },
    { priority: 800, cardType: 6 },
    { priority: 810, cardType: 6 },
    { priority: 820, cardType: 6 },
    { priority: 830, cardType: 6 },
    { priority: 840, cardType: 6 }
  ];
})(GameLogic);
