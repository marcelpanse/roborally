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

    return calcPosition(x,y);
  },
  positionYellow: function() {
    var x = this.players[1].position.x;
    var y = this.players[1].position.y;

    return calcPosition(x,y);
  },
  directionBlue: function() {
    return getDirection(this.players[0].direction);
  },
  directionYellow: function() {
    return getDirection(this.players[1].direction);
  },
  tiles: function() {
    return Tiles.getBoardTiles();
  },
  gameEnded: function() {
    return this.game.gamePhase == GameState.PHASE.ENDED;
  }
});

var getDirection = function (direction) {
    switch(direction) {
      case GameLogic.UP:
        return '-webkit-transform: rotate(0deg);';
      case GameLogic.RIGHT:
        return '-webkit-transform: rotate(90deg);';
      case GameLogic.DOWN:
        return '-webkit-transform: rotate(180deg);';
      case GameLogic.LEFT:
        return '-webkit-transform: rotate(270deg);';
    }
};

var calcPosition = function(x, y) {
  var tileWidth = 50;//$("#board").width()/12;
  var tileHeight = 50;//$("#board").height()/12;

  x = (tileWidth*x);
  y = (tileHeight*y);

  return "left: " + x + "px; top: " + y + "px;";
};

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
