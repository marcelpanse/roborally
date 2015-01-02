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
          Games.update(game._id, {$set: {gamePhase: GameState.PHASE.DEAL}});
          GameState.nextGamePhase(game._id);
          break;
      }
    }, _NEXT_PHASE_DELAY);
  };

  function playDealPhase(game) {
    GameLogic.makeDeck(game);

    var players = Players.find({gameId: game._id}).fetch();
    for (var i in players) {
      Players.update(players[i]._id, {$set: {playedCards: [], submittedCards: [], submitted: false}});
      GameLogic.dealCards(players[i]);
    }
    Games.update(game._id, {$set: {gamePhase: GameState.PHASE.PROGRAM}});
  }

  function playProgramCardsSubmitted(game) {
    Games.update(game._id, {$set: {gamePhase: GameState.PHASE.PLAY}});
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
      }
    }, _NEXT_PHASE_DELAY);
  };

  function playRevealCards(game) {
    Games.update(game._id, {$set: {playPhase: GameState.PLAY_PHASE.MOVE_BOTS}});

    var players = Players.find({gameId: game._id}).fetch();
    // play 1 card per player
    for (var i in players) {
      var playedCards = players[i].playedCards || [];
      if (players[i].submittedCards[0]) {
        playedCards.push(players[i].submittedCards[0]);
        Players.update(players[i]._id, {$set: {playedCards: playedCards}});
      }
    }

    GameState.nextPlayPhase(game._id);
  }

  function playMoveBots(game) {
    var players = Players.find({gameId: game._id});
    // play 1 card per player
    var cardsToPlay = [];

    players.forEach(function(player) {
      var submittedCards = player.submittedCards;
      var card = submittedCards.shift();
      if (card) {
        Players.update(player._id, {$set: {submittedCards: submittedCards}});
        card.playerId = player._id;
        cardsToPlay.push(card);
      }
    });

    cardsToPlay = _.sortBy(cardsToPlay, 'priority').reverse();

    cardsToPlay.forEach(function(card) {
      Meteor.wrapAsync(GameLogic.playCard)(game._id, card.playerId, card);
    });

    Games.update(game._id, {$set: {playPhase: GameState.PLAY_PHASE.MOVE_BOARD}});
    GameState.nextPlayPhase(game._id);
  }

  function playMoveBoard(game) {
    var players = Players.find({gameId: game._id}).fetch();
    Meteor.wrapAsync(GameLogic.executeRollers)(players);

    Games.update(game._id, {$set: {playPhase: GameState.PLAY_PHASE.LASERS}});
    GameState.nextPlayPhase(game._id);
  }

  function playLasers(game) {
    Games.update(game._id, {$set: {playPhase: GameState.PLAY_PHASE.CHECKPOINTS}});
    GameState.nextPlayPhase(game._id);
  }

  function playCheckpoints(game) {
    if (!checkIfWeHaveAWinner(game)) {
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
  }

  function checkIfWeHaveAWinner(game) {
    var players = Players.find({gameId: game._id}).fetch();
    var ended = false;
    for (var i in players) {
      var player = players[i];
      Tiles.checkCheckpoints(player);
      if (player.checkpoint1 && player.checkpoint2 && Tiles.isPlayerOnFinish(player)) {
        console.log("Player " + player.name + " won the game!!");
        Games.update(game._id, {$set: {gamePhase: GameState.PHASE.ENDED, winner: player.name}});
        ended = true;
        Chat.insert({
          gameId: player.gameId,
          message: 'Player ' + player.name + ' won the game',
          submitted: new Date().getTime()
        });
        break;
      }
    }
    return ended;
  }

})(GameState);
