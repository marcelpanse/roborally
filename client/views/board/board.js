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
  }
});

var calcPosition = function(x, y) {
  var tileWidth = 50;//$("#board").width()/12;
  var tileHeight = 50;//$("#board").height()/12;

  x = (tileWidth*x) + (tileWidth/2) - (8);
  y = (tileHeight*y) + (tileHeight/2) - (8);

  return "left: " + x + "px; top: " + y + "px;";
};
