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
      });
    });
    return r;
  },
  markers: function() {
    var m = [];
    var p_cnt = this.players.length;
    this.players.forEach(function(player) {
      var new_pos = calcPosition(player.start.x, player.start.y);
      var deg = 360 / p_cnt * player.robotId;
      m.push({
        path: "/robots/marker_"+player.robotId.toString()+".png",
        marker_class: "m" + player.robotId.toString(),
        position: 'top: '+ new_pos.y +'px; left:'+ new_pos.x +'px;',
        direction: 'transform: rotate('+ deg + 'deg);',
      });
    });
    return m;
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
  choosePosition: function() {
    return this.game.gamePhase == GameState.PHASE.REENTER && this.game.destroyedRobot.playerId === Meteor.userId() && this.destroyedRobot.phase === 'position';
  },
  chooseDirection: function() {
    return this.game.gamePhase == GameState.PHASE.REENTER && this.game.destroyedRobot.playerId === Meteor.userId() && this.destroyedRobot.phase === 'direction';
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
  },
  'click .reenter-select': function(e) {
    Meteor.call('robotReenterGame', this.game._id, e.target.id, function(error) {
      if (error)
        alert(error.reason);
    });
  }
});
