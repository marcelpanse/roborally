GameState = {
  PHASE: {
    IDLE: "waiting",
    DEAL: "deal",
    PROGRAM: "program",
    PLAY: "play",
    RESPAWN: "respawn",
    ENDED: "game ended"
  },
  PLAY_PHASE: {
    IDLE: "waiting",
    REVEAL_CARDS: "reveal",
    MOVE_BOTS: "move bots",
    MOVE_BOARD: "move board",
    LASERS: "lasers",
    CHECKPOINTS: "checkpoints",
    REPAIRS: "repairs"
  },
  RESPAWN_PHASE: {
    CHOOSE_POSITION: "choose position",
    CHOOSE_DIRECTION: "choose direction"
  }
};

(function (scope) {
  var _NEXT_PHASE_DELAY = 500;
  var _ANNOUNCE_NEXT_PHASE = 1000;
  var _ANNOUNCE_CARD_TIME = 2000;
  var _EXECUTE_CARD_TIME = 2000;

  // game phases:

  scope.nextGamePhase = function(gameId) {
    var game = Games.findOne(gameId);
    Meteor.setTimeout(function() {
      switch (game.gamePhase) {
        case GameState.PHASE.IDLE:
          Games.update(game._id, {$set: {started: true, gamePhase: GameState.PHASE.DEAL}});
          playDealPhase(game);
          break;
        case GameState.PHASE.DEAL:
          game.stopAnnounce();
          playDealPhase(game);
          break;
        case GameState.PHASE.PROGRAM:
          game.startAnnounce();
          playProgramCardsSubmitted(game);
          break;
        case GameState.PHASE.PLAY:
          if (game.waitingForRespawn.length > 0) {
            Games.update(game._id, {$set: {
              watingForRespawn: game.waitingForRespawn.reverse(),
              gamePhase: GameState.PHASE.RESPAWN
            }});
            game.nextGamePhase();
          } else {
            game.nextGamePhase(GameState.PHASE.DEAL);
          }
          break;
        case GameState.PHASE.RESPAWN:
          playNextRespawn(game);
          break;
      }
    }, _NEXT_PHASE_DELAY);
  };


  function playDealPhase(game) {
    var dealCards;
    game.players().forEach(function(player) {
      dealCards = player.lives > 0;
      player.playedCardsCnt = 0;
      player.submitted = false;

      if (player.powerState === GameLogic.OFF) {
        // player was powered down last turn
        // -> can choose to stay powered down this turn
        player.optionalInstantPowerDown = true;
      } else if (player.powerState == GameLogic.DOWN) {
        // player announced power down last turn
        player.powerState = GameLogic.OFF;
        if (!player.optionalInstantPowerDown) {
          player.submitted = true;
          player.damage = 0;
          dealCards = false;
        }
      }

      Players.update(player._id, player);
      CardLogic.discardCards(game,player);
      if (dealCards)
        CardLogic.dealCards(game, player);
    });
    game.setGamePhase(GameState.PHASE.PROGRAM);
    var notPoweredDownCnt = Players.find({gameId: game._id, submitted: false}).count();
    if (notPoweredDownCnt === 0)
      game.nextGamePhase();
    else if  (notPoweredDownCnt === 1)
      CardLogic.startTimer(game);
  }

  function playProgramCardsSubmitted(game) {
    Games.update(game._id, {$set: {
      gamePhase: GameState.PHASE.PLAY,
      playPhase: GameState.PLAY_PHASE.IDLE,
      playPhaseCount: 1
    }});
    game.nextPlayPhase();
  }

  function playNextRespawn(game) {
    if (game.waitingForRespawn.length > 0) {
      var player = Players.findOne(game.waitingForRespawn.pop());
      var nextPhase;
      var x = player.start.x;
      var y = player.start.y;
      if (game.isPlayerOnTile(x,y)) {
        nextPhase = GameState.RESPAWN_PHASE.CHOOSE_POSITION;
      } else {
        GameLogic.respawnPlayerAtPos(player,x,y);
        nextPhase = GameState.RESPAWN_PHASE.CHOOSE_DIRECTION;
      }
      Games.update(game._id, {$set: {
        respawnPhase: nextPhase,
        respawnPlayerId: player._id,
        waitingForRespawn: game.waitingForRespawn
      }});
      game.nextRespawnPhase();
    } else {
      Games.update(game._id, {$set: {
        gamePhase: GameState.PHASE.DEAL,
        respawnUserId: null,
        respawnPlayerId: null,
        selectOptions: null
      }});
      game.nextGamePhase();
    }
  }

  // play phases:

  scope.nextPlayPhase = function(gameId) {
    var game = Games.findOne(gameId);
    Meteor.setTimeout(function() {
      switch (game.playPhase) {
        case GameState.PLAY_PHASE.IDLE:
          game.nextPlayPhase(GameState.PLAY_PHASE.REVEAL_CARDS);
          break;
        case GameState.PLAY_PHASE.REVEAL_CARDS:
          playRevealCards(game);
          break;
        case GameState.PLAY_PHASE.MOVE_BOTS:
          playMoveBots(game);
          break;
        case GameState.PLAY_PHASE.MOVE_BOARD:
          announce(game, playMoveBoard);
          break;
        case GameState.PLAY_PHASE.LASERS:
          announce(game, playLasers);
          break;
        case GameState.PLAY_PHASE.CHECKPOINTS:
          playCheckpoints(game);
          //announce(game, playCheckpoints);
          break;
        case GameState.PLAY_PHASE.REPAIRS:
          announce(game, playRepairs);
          break;
      }
    }, _NEXT_PHASE_DELAY);
  };

  function announce(game, callback) {
    Meteor.setTimeout(function() {
      callback(game);
    }, _ANNOUNCE_NEXT_PHASE);
  }

  function playRevealCards(game) {
    Games.update(game._id, {$set: {playPhase: GameState.PLAY_PHASE.MOVE_BOTS}});

    var players = game.livingPlayers();
    // play 1 card per player
    for (var i in players) {
      if (players[i].isActive()) {
        var cards = players[i].cards;
        var cardIndex = players[i].playedCardsCnt;
        console.log("reveal", cardIndex, players[i].getChosenCards()[cardIndex]);
        cards[cardIndex] = players[i].getChosenCards()[cardIndex];
        Players.update(players[i]._id, {$set: {cards: cards}});
      }
    }
    GameState.nextPlayPhase(game._id);
  }

  function playMoveBots(game) {
    var players = game.activePlayers();
    // play 1 card per player
    game.cardsToPlay = [];

    players.forEach(function(player) {
      var card = {
        cardId: player.getChosenCards()[player.playedCardsCnt]
      };
      if (card.cardId >= 0) {
        Players.update(player._id, {$inc: {playedCardsCnt: 1}});
        card.playerId = player._id;
        game.cardsToPlay.push(card);
      }
    });
    game.cardsToPlay = _.sortBy(game.cardsToPlay, 'cardId').reverse();  // cardId has same order as card priority
    Games.update(game._id, {$set: {
      cardsToPlay: game.cardsToPlay
    }});
    if (game.cardsToPlay.length > 0)
      playMoveBot(game);
    else
      game.nextPlayPhase(GameState.PLAY_PHASE.MOVE_BOARD);
  }

  function playMoveBot(game) {
    var card = game.cardsToPlay.shift();
    Games.update(game._id, {$set: {
          announceCard: card,
          cardsToPlay: game.cardsToPlay
        }});
    var player = Players.findOne(card.playerId);
    Meteor.setTimeout(function() {
      Games.update(game._id, {$set: {
          announceCard: null,
        }});
      Meteor.wrapAsync(GameLogic.playCard)(player, card.cardId);
      if (game.cardsToPlay.length > 0) {
        Meteor.setTimeout(function() {
          playMoveBot(game);
        }, _EXECUTE_CARD_TIME);
      } else
        Meteor.setTimeout(function() {
          Games.update(game._id, {$set: {
              announceCard: null,
            }});
          game.nextPlayPhase(GameState.PLAY_PHASE.MOVE_BOARD);
        }, _EXECUTE_CARD_TIME);
    }, _ANNOUNCE_CARD_TIME);
  }

  function playMoveBoard(game) {
    var players = game.playersOnBoard();
    Meteor.wrapAsync(GameLogic.executeRollers)(players);
    Meteor.wrapAsync(GameLogic.executeExpressRollers)(players);
    Meteor.wrapAsync(GameLogic.executeGears)(players);
    Meteor.wrapAsync(GameLogic.executePushers)(players);

    game.nextPlayPhase(GameState.PLAY_PHASE.LASERS);
  }

  function playLasers(game) {
    var players = game.playersOnBoard();
    Meteor.wrapAsync(GameLogic.executeLasers)(players);
    game.nextPlayPhase(GameState.PLAY_PHASE.CHECKPOINTS);
  }

  function playCheckpoints(game) {
    if (!checkIfWeHaveAWinner(game)) {
      if (game.playPhaseCount < 5) {
        Games.update(game._id,
          { $set: {playPhase: GameState.PLAY_PHASE.REVEAL_CARDS}, $inc: {playPhaseCount: 1} }
        );
        game.nextPlayPhase();
      } else {
        game.nextPlayPhase(GameState.PLAY_PHASE.REPAIRS);
      }
    }
  }

  function playRepairs(game) {
    var players = game.playersOnBoard();
    Meteor.wrapAsync(GameLogic.executeRepairs)(players);
    game.nextGamePhase();
  }

  function checkCheckpoints(player,game) {
    var tile = player.tile();

    if (tile.checkpoint) {
      player.updateStartPosition();
      if (tile.checkpoint === player.visited_checkpoints+1) {
        player.visited_checkpoints++;
      }
      Players.update(player._id, player);
      return true;
    } else if (tile.repair) {
      player.updateStartPosition();
      Players.update(player._id, player);
    }
    return false;
  }

  function checkIfWeHaveAWinner(game) {
    var players = Players.find({gameId: game._id}).fetch();
    var board = game.board();
    var ended = false;
    var lastManStanding = false;
    var livingPlayers = 0;
    var messages = [];

    for (var i in players) {
      var player = players[i];
      checkCheckpoints(player,game);
      if (player.lives > 0) {
        livingPlayers++;
        lastManStanding = player;
      } else {
        messages.push('Player ' + player.name + ' ran out of lives');
      }

      if (player.visited_checkpoints === board.checkpoints.length) {
        Games.update(game._id, {$set: {gamePhase: GameState.PHASE.ENDED, winner: player.name, stopped: new Date().getTime()}});
        messages.push("Player " + player.name + " won the game!!");
        ended = true;
        break;
      }
    }

    if (livingPlayers === 0) {
      messages.push("All robots are dead");
      Games.update(game._id, {$set: {gamePhase: GameState.PHASE.ENDED, winner: "Nobody", stopped: new Date().getTime()}});
      ended = true;
    } else if (livingPlayers === 1 && players.length > 1) {
      messages.push("Player " + lastManStanding.name + " won the game!!");
      Games.update(game._id, {$set: {gamePhase: GameState.PHASE.ENDED, winner: lastManStanding.name, stopped: new Date().getTime()}});
      ended = true;
    }
    messages.forEach(function(msg) {
      game.chat(msg);
    });
    return ended;
  }

  // respawn phases
  scope.nextRespawnPhase = function(gameId) {
    var game = Games.findOne(gameId);
    Meteor.setTimeout(function() {
      switch (game.respawnPhase) {
        case GameState.RESPAWN_PHASE.CHOOSE_POSITION:
          prepareChooseRespawnPosition(game);
          break;
        case GameState.RESPAWN_PHASE.CHOOSE_DIRECTION:
          prepareChooseRespawnDirection(game);
          break;
      }
    }, _NEXT_PHASE_DELAY);
  };


  function prepareChooseRespawnPosition(game) {
    var player = Players.findOne(game.respawnPlayerId);
    var selectOptions = [];
    var x = player.start.x;
    var y = player.start.y;
    for (var dx = -1; dx<=1; ++dx) {
      for (var dy = -1; dy<=1; dy++)  {
        if (!game.isPlayerOnTile(x+dx,y+dy) && game.board().getTile(x+dx,y+dy).type !== Tile.VOID) {
          selectOptions.push({x:x+dx, y:y+dy});
        }
      }
    }
    Games.update(game._id, {$set: {
      selectOptions: selectOptions,
      respawnUserId: player.userId
    }});
  }

  function prepareChooseRespawnDirection(game) {
    var player = Players.findOne(game.respawnPlayerId);
    var selectOptions = [];
    var x = player.position.x;
    var y = player.position.y;
    var step;
    if (player.start.x != x && player.start.y != y) {
      for (var i=0; i<4; ++i) {
        step = Board.to_step(i);
        if (noPlayerOnNextThree(x,y,step.x,step.y, game))
          selectOptions.push({x: x+step.x, y:y+step+y, dir: i});
      }
    } else {
      for (var j=0; j<4; ++j) {
        step = Board.to_step(j);
        selectOptions.push({
          x: x+step.x,
          y: y+step.y,
          dir: j
        });
      }
    }
    Games.update(game._id, {$set: {
      selectOptions: selectOptions,
      respawnUserId: player.userId
    }});
  }


  function noPlayerOnNextThree(x,y,dx,dy, game) {
    return  !game.isPlayerOnTile(x+dx,y+dy) && !game.isPlayerOnTile(x+2*dx,y+2*dy) && !game.isPlayerOnTile(x+3*dx,y+3*dy);
  }
})(GameState);
