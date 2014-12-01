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
    CHECKPOINTS: "checkpoints"
  }
};

(function (scope) {

  // game phases:

  scope.nextGamePhase = function(gameId) {
    var game = Games.findOne(gameId);
    Meteor.setTimeout(function() {
      switch (game.gamePhase) {
        case GameState.PHASE.IDLE:
          Games.update(game._id, {$set: {started: true, gamePhase: GameState.PHASE.DEAL}});
          playDeal(game);
          break;
        case GameState.PHASE.DEAL:
          playDeal(game);
          break;
        case GameState.PHASE.PROGRAM:
          playProgramCardsSubmitted(game);
          break;
        case GameState.PHASE.PLAY:
          playCheckGameEnded(game);
          break;
      }
    }, 1000);
  };

  function playDeal(game) {
    var players = Players.find({gameId: game._id}).fetch();
    for (var i in players) {
      GameLogic.drawCards(players[i]);
    }
    Games.update(game._id, {$set: {gamePhase: GameState.PHASE.PROGRAM}});
  }

  function playProgramCardsSubmitted(game) {
    Games.update(game._id, {$set: {gamePhase: GameState.PHASE.PLAY}});
    GameState.nextPlayPhase(game._id);
  }

  function playCheckGameEnded(game) {
    var players = Players.find({gameId: game._id}).fetch();
    var ended = false;
    for (var i in players) {
      if (Tiles.isPlayerOnFinish(players[i])) {
        console.log("Player " + players[i].name + " won the game!!");
        Games.update(game._id, {$set: {gamePhase: GameState.PHASE.ENDED, winner: players[i].name}});
        ended = true;
      }
    }
    if (!ended) {
      Games.update(game._id, {$set: {gamePhase: GameState.PHASE.DEAL}});
      GameState.nextGamePhase(game._id);
    }
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
      }
    }, 1000);
  };

  function playRevealCards(game) {
    Games.update(game._id, {$set: {playPhase: GameState.PLAY_PHASE.MOVE_BOTS}});
    GameState.nextPlayPhase(game._id);
  }

  function playMoveBots(game) {
    var submittedPlayers = Players.find({gameId: game._id, 'submittedCards.0': {$exists: true}}).fetch();
    for (var i in submittedPlayers) {
      var submittedCards = submittedPlayers[i].submittedCards;
      var cardToPlay = submittedCards.shift();
      var cardObj = Cards.findOne({playerId: submittedPlayers[i]._id});
      var playerCards = cardObj.cards;
      var index = playerCards.indexOf(cardToPlay);
      if (index > -1) {
        GameLogic.playCard(submittedPlayers[i], cardToPlay);
        Players.update(submittedPlayers[i]._id, {$set: {submittedCards: submittedCards}});
        playerCards.splice(index, 1);
        Cards.update(cardObj._id, {$set: {cards: playerCards}});
      }
    }
    Games.update(game._id, {$set: {playPhase: GameState.PLAY_PHASE.MOVE_BOARD}});
    GameState.nextPlayPhase(game._id);
  }

  function playMoveBoard(game) {
    Games.update(game._id, {$set: {playPhase: GameState.PLAY_PHASE.LASERS}});
    GameState.nextPlayPhase(game._id);
  }

  function playLasers(game) {
    Games.update(game._id, {$set: {playPhase: GameState.PLAY_PHASE.CHECKPOINTS}});
    GameState.nextPlayPhase(game._id);
  }

  function playCheckpoints(game) {
    if (game.playPhaseCount < 4) {
      Games.update(game._id,
        { $set: {playPhase: GameState.PLAY_PHASE.REVEAL_CARDS}, $inc: {playPhaseCount: 1} }
      );
      GameState.nextPlayPhase(game._id);
    } else {
      Games.update(game._id,
        { $set: {playPhase: GameState.PLAY_PHASE.IDLE, playPhaseCount: 0} }
      );
      GameState.nextGamePhase(game._id);
    }
  }

})(GameState);
