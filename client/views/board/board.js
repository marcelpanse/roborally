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
    var p = [];
    for (var i in this.players) {
      var player = this.players[i];
      var rclass = "r" + i;
      p.push({
        path: "/robots/robot_"+i.toString()+".png",
        robot_class: rclass,
        direction: animateRotation(rclass, player.direction),
        position: animatePosition(rclass, player.position.x, player.position.y),
      });
    }
    return p;
  },
  markers: function() {
    var p = [];
    for (var i in this.players) {
      var player = this.players[i];
      var mclass = "m" + i;
      new_pos = calcPosition(player.start.x, player.start.y);
      deg = 360 / (this.players.length+1) * i;
      p.push({
        path: "/robots/marker_"+i.toString()+".png",
        robot_class: mclass,
        position: 'top: '+ new_pos.y +'px; left:'+ new_pos.x +'px;',
        direction: 'transform: rotate('+ deg + 'deg);',
      });
    }
    return p;
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
  }
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
  var wasUndefined = false;
  if (oldRotation === undefined) {
    oldRotation = 0;
    wasUndefined=true;
  } else if (oldRotation !== 0) {
    oldRotation = parseInt(oldRotation.match(/\d+/g)[0]);
  }

  var newRotation = 0;
  switch(direction) {
    case GameLogic.UP:
      newRotation = 0;
      break;
    case GameLogic.RIGHT:
      newRotation = 90;
      break;
    case GameLogic.DOWN:
      newRotation = 180;
      break;
    case GameLogic.LEFT:
      newRotation = 270;
      break;
  }

  if (newRotation != oldRotation) {
    Tracker.afterFlush(function() {
      var delta = newRotation - (oldRotation % 360);

      if (delta == 270 && !wasUndefined) {
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

function calcPosition(x, y) {
  var tileWidth = 50;//$("#board").width()/12;
  var tileHeight = 50;//$("#board").height()/12;

  x = (tileWidth*x);
  y = (tileHeight*y);

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
  }
});
