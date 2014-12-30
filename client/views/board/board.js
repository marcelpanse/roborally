Template.board.helpers({
  inGame: function() {
    for (var i in this.players) {
      if (this.players[i].userId == Meteor.userId()) {
        return true;
      }
    }
    return false;
  },
  getRobotId: function() {
    return this.players[0].userId == Meteor.userId() ? 1 : 2;
  },
  positionBlue: function() {
    var x = this.players[0].position.x;
    var y = this.players[0].position.y;
    return animatePosition("#r1", x, y);
  },
  positionYellow: function() {
    var x = this.players[1].position.x;
    var y = this.players[1].position.y;
    return animatePosition("#r2", x, y);
  },
  directionBlue: function() {
    return animateRotation("#r1", this.players[0].direction);
  },
  directionYellow: function() {
    return animateRotation("#r2", this.players[1].direction);
  },
  tiles: function() {
    return Tiles.getBoardTiles();
  },
  gameEnded: function() {
    return this.game.gamePhase == GameState.PHASE.ENDED;
  }
});

function animatePosition(element, x, y) {
  var newPosition = calcPosition(x,y);
  var oldX = newPosition.x;
  var oldY = newPosition.y;

  var position = $(element).position();
  if (position) {
    oldX = position.left;
    oldY = position.top;

    if (oldX != newPosition.x || oldY != newPosition.y) {
      Tracker.afterFlush(function() {
        var deltaX = newPosition.x - oldX;
        var deltaY = newPosition.y - oldY;
        $(element).stop();

        $(element).animate({
          left: "+=" + deltaX + "px",
          top: "+=" + deltaY + "px"
        }, Math.max(Math.abs(deltaX), Math.abs(deltaY)) * 4);
      });
    }
  }
  return "left: " + oldX + "px; top: " + oldY + "px;";
}

function animateRotation(element, direction) {
  var oldRotation = $(element).css('rotate');
  if (oldRotation === undefined) {
    oldRotation = 0;
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

      if (delta == 270) {
        delta = -90;
      }
      if (delta == -270) {
        delta = 90;
      }

      $(element).stop();
      $(element).transition({
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
