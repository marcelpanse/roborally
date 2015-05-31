Meteor.startup(function () {
  var everyHour = new Cron(function() {
    //runs every hours and builds the highscores list
    console.log("Building highscore lists");

    //TODO: later we can make this into a proper ELO calculation..
    var mostWon = Games.aggregate([
      {$match: {winner: {$ne: "Nobody"}}},
      {$group: {_id: "$winner", count: {$sum: 1}}},
      {$sort: {count: -1}},
      {$limit: 10}
    ]);

    var mostPlayed = Players.aggregate([
      {$group: {_id: "$name", count: {$sum: 1}}},
      {$sort: {count: -1}},
      {$limit: 10}
    ]);

    Highscores.remove({}); //clear highscores

    addToHighscores(mostWon, 'mostWon');
    addToHighscores(mostPlayed, 'mostPlayed');

  }, {minute: 0}); //every 0 minute of every hour.

  var everyMinute = new Cron(function() {
    //runs every minute and cleans up abandoned games.
    var openGames = Games.find({started: false}).fetch();
    openGames.forEach(function(game) {
      if (!Meteor.users.findOne(game.userId).status.online) {
        //wait couple of seconds and re-check before deleting the game, to make sure it wasn't a refresh or temporary.
        console.log("Found disconnected owner, waiting couple of seconds: " + game._id);
        Meteor.setTimeout(function() {
          if (!Meteor.users.findOne(game.userId).status.online) {
            console.log("Removing game with disconnected owner: " + game._id);
            Games.remove(game._id);
          }
        }, 5000);
      }
    });

    var liveGames = Games.find({started: true, winner: {$exists: false}}).fetch();
    liveGames.forEach(function(game) {
      var players = Players.find({gameId: game._id}).fetch();
      var playersOnline = 0;
      var lastManStanding = false;
      var nrOfPlayers = players.length;
      var nrOfPlayersChecked = 0;

      players.forEach(function(player) {
        if (!Meteor.users.findOne(player.userId).status.online) {
          //wait couple of seconds and re-check before deleting the game, to make sure it wasn't a refresh or temporary.
          console.log("Found disconnected player, waiting couple of seconds: " + game._id);
          Meteor.setTimeout(function() {
            if (!Meteor.users.findOne(player.userId).status.online) {
              //really offline
              var debug_info = "Forfeitting game with disconnected player: " + game._id;
              player.chat('disconnected and left the game', debug_info);
              nrOfPlayersChecked++;
            } else {
              //did come online
              lastManStanding = player;
              playersOnline++;
              nrOfPlayersChecked++;
            }
          }, 5000);
        } else {
          lastManStanding = player;
          playersOnline++;
          nrOfPlayersChecked++;
        }
      });
      //this will wait untill all checks are finished.
      var handle = Meteor.setInterval(function() {
        console.log("waiting for player to come back online..");
        if (nrOfPlayersChecked >= nrOfPlayers) {
          console.log("all players checked, players online: ", playersOnline);
          Meteor.clearInterval(handle);
          if (playersOnline === 0) {
            Games.update(game._id, {$set: {gamePhase: GameState.PHASE.ENDED, winner: "Nobody", stopped: new Date().getTime()}});
          } else if (playersOnline == 1 && game.min_player > 1) {
            Games.update(game._id, {$set: {gamePhase: GameState.PHASE.ENDED, winner: lastManStanding.name, stopped: new Date().getTime()}});
          }
          //else do nothing, game still in progress..
        }
      }, 1000);
    });

    //cleanup inactive users
    var d = new Date();
    d.setMinutes(d.getMinutes() - 30);
    Meteor.users.update({"status.lastActivity": {$lt: d}}, {$set: {"status.online": false}}, {multi: true});

  }, {});
});

function addToHighscores(arr, type) {
  _(arr).each(function (x, i) {
    Highscores.insert({
      type: type,
      name: x._id,
      value: x.count,
      rank: i+1
    });
  });
}