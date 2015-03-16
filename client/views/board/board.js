Template.board.helpers({
  inGame: function() {
    return _.some(this.players, function(player) {
      return player.userId === Meteor.userId();
    });
  },
  player: function() {
    for (var i in this.players) {
      var player = this.players[i];
      if (player.userId === Meteor.userId()) {
        return player;
      }
    }
  },

  robots: function() {
    var r = [];
    this.players.forEach(function(player) {
      var rclass = "r" + player.robotId;
      r.push({
        path: "/robots/robot_"+player.robotId.toString()+".png",
        robot_class: rclass,
        direction: animateRotation(rclass, player.direction),
        position: animatePosition(rclass, player.position.x, player.position.y),
        poweredDown: player.isPoweredDown()
      });
    });
    return r;
  },
  markers: function() {
    var m = [];
    var p_cnt = this.players.length;
    this.players.forEach(function(player) {
      var deg = 360 / p_cnt * player.robotId;
      m.push({
        path: "/robots/marker_"+player.robotId.toString()+".png",
        marker_class: "m" + player.robotId.toString(),
        position: cssPosition(player.start.x, player.start.y),
        direction: cssRotate(deg)
      });
    });
    return m;
  },
  shots: function() {
    var laserWidth = 4;
    var tileWidth = 50;
    var startOffset = 5;
    var s = [];
    if (this.game.playPhase === GameState.PLAY_PHASE.CHECKPOINTS) {
      this.players.forEach(function(player,i) {
        if (!player.isPoweredDown() && !player.needsRespawn) {
          var offsetY;
          var offsetX;
          var animate = {};
          var animateRev = {};
          var style = '';
          var lc = 'l'+i;
          switch (player.direction%2) {
            case 0:  // up or down
              animate.height = tileWidth*player.shotDistance + "px";
              animateRev.height = "0px";
              style   = 'width: '+laserWidth+'px;';
              style   += 'height: 0px;';
              offsetX = (tileWidth-laserWidth)/2;
              break;
            case 1: // left or right
              animate.width = tileWidth*player.shotDistance + "px";
              animateRev.width = "0px";
              style   = 'height: '+laserWidth+'px;';
              style   += 'width: 0px;';
              offsetY = (tileWidth-laserWidth)/2;
              break;
          }

          switch (player.direction) {
            case GameLogic.UP:
              offsetY = startOffset;
              animate.top = "-=" + (tileWidth*player.shotDistance-startOffset) + "px";
              break;
            case GameLogic.LEFT:
              offsetX = startOffset;
              animate.left = "-="+ (tileWidth*player.shotDistance-startOffset) + "px";
              break;
            case GameLogic.DOWN:
              animateRev.top = "+=" + (tileWidth*player.shotDistance-startOffset) + "px";
              offsetY = tileWidth-startOffset;
              break;
            case GameLogic.RIGHT:
              animateRev.left = "+=" + (tileWidth*player.shotDistance-startOffset) + "px";
              offsetX = tileWidth-startOffset;
              break;
          }
          style += cssPosition(player.position.x, player.position.y, offsetX, offsetY);
          Tracker.afterFlush(function() {
            var once = false;
            $('.'+lc).stop();
            $('.'+lc).animate(animate, {duration: 400, queue: false, progress: function(anim, progress, remainingMs) {
              if (remainingMs <= 350 && !once) {
                $('.'+lc).animate(animateRev, { duration: 400, queue: false });
                once = true;
              }
            }});
          });
          s.push({shot:style, laser_class: lc});
        }
      });
    }
    return s;
  },
  getRobotId: function() {
    return Players.findOne({userId: Meteor.userId()}).robotId.toString();
  },

  tiles: function() {
    return this.game.board().tiles;
  },
  gameEnded: function() {
    return this.game.gamePhase == GameState.PHASE.ENDED;
  },
  boardWidth: function() {
    return this.game.board().width * 50;
  },
  boardHeight: function() {
    return this.game.board().height * 50;
  },
  selectOptions: function() {
    var s = [];
    var game = this.game;
    console.log(game.respawnUserId);
    if (this.game.respawnUserId === Meteor.userId()) {
      game.selectOptions.forEach(function(opts) {
        opts.position = cssPosition(opts.x, opts.y);
        opts.gameId   = game._id;
        if (game.respawnPhase === GameState.RESPAWN_PHASE.CHOOSE_POSITION) {
          opts.select_class = 'position-select pointer';
          opts.title = 'choose a starting position';
        } else if (game.respawnPhase === GameState.RESPAWN_PHASE.CHOOSE_DIRECTION) {
          opts.select_class = 'direction-select pointer';
          opts.title = 'choose the direction you want to face';
        }
        s.push(opts);
      });
    }
    return s;
  },
});

function animatePosition(element, x, y) {
  var newPosition = calcPosition(x,y);
  var oldX = newPosition.x;
  var oldY = newPosition.y;

  var position = $("."+element).position();
  if (position) {
    oldX = position.left;
    oldY = position.top;

    if (oldX != newPosition.x || oldY != newPosition.y) {
      Tracker.afterFlush(function() {
        var deltaX = newPosition.x - oldX;
        var deltaY = newPosition.y - oldY;
        $("."+element).stop();

        $("."+element).animate({
          left: "+=" + deltaX + "px",
          top: "+=" + deltaY + "px"
        }, Math.max(Math.abs(deltaX), Math.abs(deltaY)) * 4);
      });
    }
  }

  Tracker.afterFlush(function() {
    $(function () {
      $('[data-toggle="tooltip"]').tooltip();
    });
  });

  return "left: " + oldX + "px; top: " + oldY + "px;";
}

function animateRotation(element, direction) {
  var oldRotation = $("."+element).css('rotate');
  if (oldRotation === undefined) {
    oldRotation = 0;
  } else if (oldRotation !== 0) {
    oldRotation = parseInt(oldRotation.match(/\d+/g)[0]);
  }

  var newRotation = direction * 90;

  if (newRotation != oldRotation) {
    Tracker.afterFlush(function() {
      var delta = newRotation - (oldRotation % 360);

      if (delta == 270) {
        if(oldRotation===0) {
          $("."+element).transition({
            rotate: '+=359deg'
          }, 0, 'linear');
          delta = -89;
        } else
          delta = -90;
      }
      if (delta == -270) {
        delta = 90;
      }

      $("."+element).stop();
      $("."+element).transition({
        rotate: '+='+delta+'deg'
      }, 300, 'linear');
    });
  }
  return '';
}

function cssPosition(x,y, offsetX, offsetY) {
  var coord = calcPosition(x, y, offsetX, offsetY);
  return 'top: '+ coord.y +'px; left:'+ coord.x +'px;';
}

function cssRotate(deg) {
  var rotate = "rotate(" +deg+ "deg);";
  return 'transform: '+rotate+' -webkit-transform: '+rotate+' -ms-transform: '+rotate;
}

function calcPosition(x, y, offsetX, offsetY) {
  if (offsetX == null)
    offsetX = 0;
  if (offsetY == null)
    offsetY = 0;

  var tileWidth = 50;//$("#board").width()/12;
  var tileHeight = 50;//$("#board").height()/12;

  x = (tileWidth*x)+offsetX;
  y = (tileHeight*y)+offsetY;

  return {x: x, y: y};
}

Template.board.events({
  'click .cancel': function() {
    if (this.game.gamePhase != GameState.PHASE.ENDED) {
      if (confirm("If you leave, you will forfeit the game, are you sure you want to give up?")) {
        Meteor.call('leaveGame', this.game._id, function(error) {
          if (error)
            alert(error.reason);
          Router.go('gamelist.page');
        });
      }
    } else {
      Router.go('gamelist.page');
    }
  },
  'click .position-select': function(e) {
    Meteor.call('selectRespawnPosition', this.gameId, $(e.target).attr('data-x'), $(e.target).attr('data-y'), function(error) {
      if (error)
        alert(error.reason);
    });
  },
  'click .direction-select': function(e) {
    Meteor.call('selectRespawnDirection', this.gameId, $(e.target).attr('data-dir'), function(error) {
      if (error)
        alert(error.reason);
    });
  }
});
