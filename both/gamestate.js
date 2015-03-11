GameState = {
  PHASE: {
    IDLE: "waiting",
    DEAL: "deal",
    PROGRAM: "program",
    PLAY: "play",
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
  }
};

(function (scope) {
  var _NEXT_PHASE_DELAY = 500;

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
          playDealPhase(game);
          break;
        case GameState.PHASE.PROGRAM:
          playProgramCardsSubmitted(game);
          break;
        case GameState.PHASE.PLAY:
          var players = Players.find({gameId: game._id}).fetch();
          for(var i in players) {
            if(players[i].needsRespawn && players[i].lives>0) {
              console.log("Sending respawn for "+players[i].name);
              GameLogic.respawnPlayer(players[i]);
            }
          }
          Games.update(game._id, {$set: {gamePhase: GameState.PHASE.DEAL}});
          GameState.nextGamePhase(game._id);
          break;
      }
    }, _NEXT_PHASE_DELAY);
  };

  function playDealPhase(game) {
    var players = Players.find({gameId: game._id}).fetch();
    GameLogic.discardCards(game,players);
    GameLogic.makeDeck(game._id);
    for (var i in players) {
      Players.update(players[i]._id, {$set: {playedCards: [], submittedCards: [], submittedLockedCards: [], submitted: false}});
      GameLogic.dealCards(players[i]);
    }
    Games.update(game._id, {$set: {gamePhase: GameState.PHASE.PROGRAM}});
  }

  function playProgramCardsSubmitted(game) {
    Games.update(game._id, {$set: {gamePhase: GameState.PHASE.PLAY, playPhase: GameState.PLAY_PHASE.IDLE, playPhaseCount: 1}});
    GameState.nextPlayPhase(game._id);
  }

  // play phases:

  scope.nextPlayPhase = function(gameId) {
    var game = Games.findOne(gameId);
    Meteor.setTimeout(function() {
      switch (game.playPhase) {
        case GameState.PLAY_PHASE.IDLE:
          Games.update(game._id, {$set: {playPhase: GameState.PLAY_PHASE.REVEAL_CARDS}});
          GameState.nextPlayPhase(game._id);
          break;
        case GameState.PLAY_PHASE.REVEAL_CARDS:
          playRevealCards(game);
          break;
        case GameState.PLAY_PHASE.MOVE_BOTS:
          playMoveBots(game);
          break;
        case GameState.PLAY_PHASE.MOVE_BOARD:
          playMoveBoard(game);
          break;
        case GameState.PLAY_PHASE.LASERS:
          playLasers(game);
          break;
        case GameState.PLAY_PHASE.CHECKPOINTS:
          playCheckpoints(game);
          break;
        case GameState.PLAY_PHASE.REPAIRS:
          playRepairs(game);
          GameState.nextGamePhase(game._id);
          break;
      }
    }, _NEXT_PHASE_DELAY);
  };

  function playRevealCards(game) {
    Games.update(game._id, {$set: {playPhase: GameState.PLAY_PHASE.MOVE_BOTS}});

    var players = Players.find({gameId: game._id}).fetch();
    // play 1 card per player
    for (var i in players) {
      var playedCards = players[i].playedCards || [];
      if (players[i].submittedCards[0] || players[i].submittedLockedCards[0]) {
        if(players[i].submittedCards[0]) {
          playedCards.push(players[i].submittedCards[0]);
        } else {
          playedCards.push(players[i].submittedLockedCards[0]);
        }
        Players.update(players[i]._id, {$set: {playedCards: playedCards}});
      }
    }

    GameState.nextPlayPhase(game._id);
  }

  function playMoveBots(game) {
    var players = Players.find({gameId: game._id}).fetch();
    // play 1 card per player
    var cardsToPlay = [];

    players.forEach(function(player) {
      var submittedLockedCards = player.submittedLockedCards;
      var submittedCards = player.submittedCards;
      var card = null;
      if(submittedCards.length>0) {
        card = submittedCards.shift();
      } else {
        card = submittedLockedCards.shift();
      }
      if (card) {
        Players.update(player._id, {$set: {submittedCards: submittedCards, submittedLockedCards: submittedLockedCards}});
        card.playerId = player._id;
        cardsToPlay.push(card);
      }
    });

    cardsToPlay = _.sortBy(cardsToPlay, 'priority').reverse();

    cardsToPlay.forEach(function(card) {
      Games.update(game._id, {$set: {playPhase: GameState.PLAY_PHASE.MOVE_BOTS}});
      var player = Players.findOne(card.playerId);
      Meteor.wrapAsync(GameLogic.playCard)(players, player, card);
    });

    Games.update(game._id, {$set: {playPhase: GameState.PLAY_PHASE.MOVE_BOARD}});
    GameState.nextPlayPhase(game._id);
  }

  function playMoveBoard(game) {
    var players = Players.find({gameId: game._id}).fetch();
    Meteor.wrapAsync(GameLogic.executeRollers)(players);
    Meteor.wrapAsync(GameLogic.executeExpressRollers)(players);
    Meteor.wrapAsync(GameLogic.executeGears)(players);
    Meteor.wrapAsync(GameLogic.executePushers)(players);

    Games.update(game._id, {$set: {playPhase: GameState.PLAY_PHASE.LASERS}});
    GameState.nextPlayPhase(game._id);
  }

  function playLasers(game) {
    var players = Players.find({gameId: game._id}).fetch();
    Meteor.wrapAsync(GameLogic.executeLasers)(players);
    Games.update(game._id, {$set: {playPhase: GameState.PLAY_PHASE.CHECKPOINTS}});
    GameState.nextPlayPhase(game._id);
  }

  function playCheckpoints(game) {
    if (!checkIfWeHaveAWinner(game)) {
      if (game.playPhaseCount < 5) {
        Games.update(game._id,
          { $set: {playPhase: GameState.PLAY_PHASE.REVEAL_CARDS}, $inc: {playPhaseCount: 1} }
        );
        GameState.nextPlayPhase(game._id);
      } else {
        Games.update(game._id,
          { $set: {playPhase: GameState.PLAY_PHASE.REPAIRS} }
        );
        GameState.nextPlayPhase(game._id);
      }
    }
  }

  function playRepairs(game) {
    var players = Players.find({gameId: game._id}).fetch();
    Meteor.wrapAsync(GameLogic.executeRepairs)(players);
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

      if (player.visisted_checkpoints === board.checkpoints.length) {
        Games.update(game._id, {$set: {gamePhase: GameState.PHASE.ENDED, winner: player.name}});
        messages.push("Player " + player.name + " won the game!!");
        ended = true;
        break;
      }
    }

    if (livingPlayers === 0) {
      messages.push("All robots are dead");
      Games.update(game._id, {$set: {gamePhase: GameState.PHASE.ENDED, winner: "Nobody"}});
      ended = true;
    } else if (livingPlayers < game.board().min_player) {
      messages.push("Player " + lastManStanding.name + " won the game!!");
      Games.update(game._id, {$set: {gamePhase: GameState.PHASE.ENDED, winner: lastManStanding.name}});
      ended = true;
    }
    messages.forEach(function(msg) {
      console.log(msg);
      Chat.insert({
        gameId: game._id,
        message: msg,
        submitted: new Date().getTime()
      });
    });
    return ended;
  }

})(GameState);
