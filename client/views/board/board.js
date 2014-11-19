Template.board.helpers({
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
  }
});

var getDirection = function (direction) {
    switch(direction) {
      case GameLogic.UP:
        return "up";
      case GameLogic.RIGHT:
        return "right";
      case GameLogic.DOWN:
        return "down";
      case GameLogic.LEFT:
        return "left";
    }
};

var calcPosition = function(x, y) {
  var tileWidth = 50;//$("#board").width()/12;
  var tileHeight = 50;//$("#board").height()/12;

  x = (tileWidth*x) + (tileWidth/2) - (8);
  y = (tileHeight*y) + (tileHeight/2) - (8);

  return "left: " + x + "px; top: " + y + "px;";
};
