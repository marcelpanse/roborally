GameLogic = {
  UP: 0,
  RIGHT: 1,
  DOWN: 2,
  LEFT: 3,
  OFF: 4,
  ON: 5,
  TIMER: 30,
  CARD_SLOTS: 5
};

(function (scope) {
  _CARD_PLAY_DELAY = 1000;

  scope.playCard = function(player, card, callback) {
    if (!player.needsRespawn)
      console.log("trying to play next card for player " + player.name);

      if (card != CardLogic.EMPTY) {
        var cardType = CardLogic.cardType(card, player.game().playerCnt());
        console.log('playing card ' + cardType.name + ' for player ' + player.name);

        player.rotate(cardType.direction);

        if (cardType.position === 0)
          Meteor.wrapAsync(checkRespawnsAndUpdateDb)(player);
        else {
          step = Math.min(cardType.position, 1);
          for (j=0;j < Math.abs(cardType.position);j++) {
            timeout = j+1 < Math.abs(cardType.position) ? 0 : _CARD_PLAY_DELAY;
            // don't delay if there is another step to execute
            players = Players.find({gameId: player.gameId}).fetch();
            executeStep(players, player, step);
            if (player.needsRespawn)
              break; // player respawned, don't continue playing out this card.
          }
        }
      } else
        console.log("card is not playable " + card + " player " + player.name);

    callback();
  };

  scope.executeRollers = function(players, callback) {
    var roller_moves = [];
    players.forEach(function(player) {
      //check if is on roller
      var tile = player.tile();
      var moving = (tile.type === Tile.ROLLER);
      if (!player.needsRespawn) {
        roller_moves.push(rollerMove(player, tile, moving));
      }
    });
    tryToMovePlayersOnRollers(roller_moves);
    callback();
  };

  // move players 2nd step in roller direction; 1st step is done by executeRollers,
  scope.executeExpressRollers = function(players, callback) {
    var roller_moves = [];
    players.forEach(function(player) {
      //check if is on roller
      var tile = player.tile();
      var moving  = (tile.type === Tile.ROLLER && tile.speed === 2);
      if (!player.needsRespawn) {
        roller_moves.push(rollerMove(player, tile, moving));
      }
    });
    tryToMovePlayersOnRollers(roller_moves);
    callback();
  };

  scope.executeGears = function(players, callback) {
    players.forEach(function(player) {
      if (player.tile().type === Tile.GEAR) {
        player.rotate(player.tile().rotate);
        Players.update(player._id, player);
      }
    });
    callback();
  };

  scope.executePushers = function(players, callback) {
    players.forEach(function(player) {
      var tile = player.tile();
      if (tile.type === Tile.PUSHER &&  player.game().playPhaseCount % 2 === tile.pusher_type ) {
        tryToMovePlayer(players, player, tile.move);
      }
    });
    callback();
  };

  scope.executeLasers = function(players, callback) {
    var victims = [];
    players.forEach(function(player) {
      var tile = player.tile();
      if (tile.damage > 0) {
        player.addDamage(tile.damage);
        player.chat('was hit by a laser, total damage: '+ player.damage);
        checkRespawnsAndUpdateDb(player);
      }
      if (!player.isPoweredDown() && !player.needsRespawn) {
        victims = scope.shootRobotLaser(players, player, victims);
        if (player.hasOptionCard('rear-firing_laser')) {
          player.rotate(2);
          victims = scope.shootRobotLaser(players, player, victims);
          player.rotate(2);
        }
        if (player.hasOptionCard('mini_howitzer') || 
            player.hasOptionCard('fire_control')  ||
            player.hasOptionCard('radio_control') ||
            (player.hasOptionCard('scrambler') && player.game().playPhaseCount < 5) ||
            player.hasOptionCard('tractor_beam')  ||
            player.hasOptionCard('pressor_beam') ) {
          //todo: there is no game state laser options yet..?
          //player.game().setPlayPhase(GameState.PLAY_PHASE.LASER_OPTIONS);
        }
      }
    });
    victims.forEach(function(victim) {
      victim.addDamage(1);
      checkRespawnsAndUpdateDb(victim);
    });
    callback();
  };

  scope.executeRepairs = function(players, callback) {
    players.forEach(function(player) {
      if (player.tile().repair) {
        if (player.damage > 0)
          player.damage--;
        if (player.tile().option)
          player.drawOptionCard();
        Players.update(player._id, player);
      }
    });
    callback();
  };

  scope.shootRobotLaser = function(players, player, victims) {
    var step = {x:0, y:0};
    var board = player.board();
    switch (player.direction) {
      case GameLogic.UP:
        step.y = -1;
        break;
      case GameLogic.RIGHT:
        step.x = 1;
        break;
      case GameLogic.DOWN:
        step.y = 1;
        break;
      case GameLogic.LEFT:
        step.x = -1;
        break;
    }
    var x = player.position.x;
    var y = player.position.y;
    var shotDistance = 0;
    var highPower = player.hasOptionCard('high-power_laser');
    while (board.onBoard(x+step.x,y+step.y) && (board.canMove(x, y, step) || highPower) ) {
      if (highPower && !board.canMove(x,y,step))
        highPower = false;
      x += step.x;
      y += step.y;
      shotDistance++;
      var victim = isPlayerOnTile(players,x,y);
      if (victim) {
        debug_info = 'Shot: (' + player.position.x +','+player.position.y+') -> ('+x+','+y+')';
        victim.chat('was shot by '+ player.name +', Total damage: '+ (victim.damage+1), debug_info);
        Players.update(player._id,{$set: {shotDistance:shotDistance}});
        victims.push(victim);
        if (player.hasOptionCard('double-barreled_laser'))
          victims.push(victim);
        if (!highPower)
          return victims;
        highPower = false;
      }
    }
    Players.update(player._id,{$set: {shotDistance:shotDistance}});
    return victims;
  };

  function executeStep(players, player, direction) {   // direction = 1 for step forward, -1 for step backwards
    var step = { x: 0, y: 0 };
    switch (player.direction) {
      case GameLogic.UP:
        step.y = -1 * direction;
        break;
      case GameLogic.RIGHT:
        step.x = direction;
        break;
      case GameLogic.DOWN:
        step.y = direction;
        break;
      case GameLogic.LEFT:
        step.x = -1 * direction;
        break;
    }
    tryToMovePlayer(players, player, step);
  }

  function tryToMovePlayer(players, p, step) {
    var board = p.board();
    var makeMove = true;
    if (step.x !== 0 || step.y !== 0) {
      console.log("trying to move player "+p.name+" to "+ (p.position.x+step.x)+","+(p.position.y+step.y));

      if (board.canMove(p.position.x, p.position.y, step)) {
        var pushedPlayer = isPlayerOnTile(players, p.position.x + step.x, p.position.y + step.y);
        if (pushedPlayer !== null) {
          console.log("trying to push player "+pushedPlayer.name);
          if (p.hasOptionCard('ramming_gear')) 
            pushedPlayer.addDamage(1);
          makeMove=tryToMovePlayer(players, pushedPlayer, step);
        }
        if(makeMove) {
          console.log("moving player "+p.name+" to "+ (p.position.x+step.x)+","+(p.position.y+step.y));
          p.move(step);
          Meteor.wrapAsync(checkRespawnsAndUpdateDb)(p);
          return true;
        }
      }
    }
    return false;
  }

  function rollerMove(player, tile, is_moving) {
    if (is_moving) {
      return {
        player: player,
        x: player.position.x+tile.move.x,
        y: player.position.y+tile.move.y,
        rotate: tile.rotate,
        step:tile.move,
        canceled: false
      };
    } else { // to detect conflicts add non-moving players
      return {
        player: player,
        x: player.position.x,
        y: player.position.y,
        canceled: true
      };
    }
  }

  function tryToMovePlayersOnRollers(moves) {
    var move_canceled = true;
    var max = 0;
    while (move_canceled) {  // if a move was canceled we have to check for other conflicts again
      max++;
      if (max > 100) {
        console.log("Infinite loop detected.. cancelling..");
        break;
      }
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
    moves.forEach(function(roller_move) {
      if (!roller_move.canceled) {
        //move player 1 step in roller direction and rotate
        roller_move.player.move(roller_move.step);
        roller_move.player.rotate(roller_move.rotate);
        checkRespawnsAndUpdateDb(roller_move.player);
      }
    });
  }

  function isPlayerOnTile(players, x, y) {
    var found = null;
    players.forEach(function(player) {
      if (player.position.x == x && player.position.y == y && !player.needsRespawn) {
        found = player;
      }
    });
    return found;
  }

  function checkRespawnsAndUpdateDb(player, callback) {
    console.log(player.name+" Player.position "+player.position.x+","+player.position.y+" "+player.isOnBoard()+"|"+player.isOnVoid());
    if (!player.needsRespawn && (!player.isOnBoard() || player.isOnVoid() || player.damage > 9 )) {
      if (player.hasOptionCard('superior_archive'))
        player.damage = 0;
      else
        player.damage = 2;

      player.lives--;
      player.needsRespawn=true;
      player.optionalInstantPowerDown=true;
      player.optionCards = {};
      Players.update(player._id, player);
      if (player.lives > 0) {
        var game = player.game();
        game.waitingForRespawn.push(player._id);
        Games.update(game._id, game);
      }
      player.chat('died! (lives: '+ player.lives +', damage: '+ player.damage +')');
      Meteor.wrapAsync(removePlayerWithDelay)(player);
    } else {
      console.log("updating position", player.name);
      Players.update(player._id, player);
    }
    if (callback) {
      callback();
    }
  }

  function removePlayerWithDelay(player, callback) {
    Meteor.setTimeout(function() {
      player.position.x = player.board().width-1;
      player.position.y = player.board().height;
      player.direction = GameLogic.UP;
      Players.update(player._id, player);
      console.log("removing player", player.name);
      Players.update(player._id, player);
      callback();
    }, _CARD_PLAY_DELAY);
  }

  scope.respawnPlayerAtPos = function(player,x,y) {
    player.position.x = x;
    player.position.y = y;
    console.log("respawning player", player.name,'at', x,',',y);
    Players.update(player._id, player);
  };

  scope.respawnPlayerWithDir = function(player,dir) {
    player.direction = dir;
    player.needsRespawn = false;
    Players.update(player._id, player);
  };
  
})(GameLogic);
