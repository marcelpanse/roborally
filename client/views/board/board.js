Template.board.helpers({
  ownGame: function() {
    return this.userId == Meteor.userId();
  },

  positionRed: function() {
    var x = this.players[0].position.x;
    var y = this.players[0].position.y;

    return calcPosition(x,y);
  },
  positionBlue: function() {
    var x = this.players[1].position.x;
    var y = this.players[1].position.y;

    return calcPosition(x,y);
  },
  directionRed: function() {
    return getDirection(this.players[0].direction);
  },
  directionBlue: function() {
    return getDirection(this.players[1].direction);
  },

  tiles: function() {
    return Tiles.getBoardTiles();
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
    if (confirm("Remove this game?")) {
      Games.remove(this._id);
      Router.go('gamelist.page');
    }
  }
});
