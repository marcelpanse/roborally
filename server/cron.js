Meteor.startup(function () {
  var everyMinute = new Cron(function() {
    //runs every minute and cleans up abandoned games.
    console.log("running cron every minute");
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
      players.forEach(function(player) {
        if (!Meteor.users.findOne(player.userId).status.online) {
          //wait couple of seconds and re-check before deleting the game, to make sure it wasn't a refresh or temporary.
          console.log("Found disconnected player, waiting couple of seconds: " + game._id);
          Meteor.setTimeout(function() {
            if (!Meteor.users.findOne(player.userId).status.online) {
              var debug_info = "Forfeitting game with disconnected player: " + game._id;
              player.chat('disconnected and left the game', debug_info);
            }
          }, 5000);
        } else {
          lastManStanding = player;
          playersOnline++;
        }

      });
      if (playersOnline === 0) {
        Games.update(game._id, {$set: {gamePhase: GameState.PHASE.ENDED, winner: "Nobody"}});
      } else if (playersOnline < game.min_player) {
        Games.update(game._id, {$set: {gamePhase: GameState.PHASE.ENDED, winner: lastManStanding.name}});
      }

    });

    //cleanup inactive users
    var d = new Date();
    d.setMinutes(d.getMinutes() - 30);
    Meteor.users.update({"status.lastActivity": {$lt: d}}, {$set: {"status.online": false}}, {multi: true});

  }, {});
});
