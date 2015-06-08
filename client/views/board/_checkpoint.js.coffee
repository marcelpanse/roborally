Template._checkpoint.helpers
  visited: (number) ->
    player = Players.findOne({userId: Meteor.userId()})
    if player.visited_checkpoints >= number
      'visited'
    else
      return ''

  position: (tileSize) ->
    return cssPosition(this.x,this.y,0,0, tileSize)
    
@cssPosition = (x,y, offsetX, offsetY, tileSize) ->
  coord = calcPosition(x, y, offsetX, offsetY, tileSize)
  return "top: #{coord.y}px; left:#{coord.x}px;"

@calcPosition = (x, y, offsetX=0, offsetY=0, tileSize=50) ->
  x = (tileSize*x)+offsetX
  y = (tileSize*y)+offsetY

  return {x: x, y: y}