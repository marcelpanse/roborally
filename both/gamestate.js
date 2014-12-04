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
          playDealPhase(game);
          break;
        case GameState.PHASE.DEAL:
          playDealPhase(game);
          break;
        case GameState.PHASE.PROGRAM:
          playProgramCardsSubmitted(game);
          break;
        case GameState.PHASE.PLAY:
          checkIfWeHaveAWinner(game);
          break;
      }
    }, 300);
  };

  function playDealPhase(game) {
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

  function checkIfWeHaveAWinner(game) {
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
    }, 300);
  };

  function playRevealCards(game) {
    Games.update(game._id, {$set: {playPhase: GameState.PLAY_PHASE.MOVE_BOTS}});
    GameState.nextPlayPhase(game._id);
  }

  function playMoveBots(game) {
    var players = Players.find({gameId: game._id}).fetch();
    // play 1 card per player
    for (var i in players) {
      Meteor.wrapAsync(GameLogic.playCard)(game._id, players[i]._id);
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
