Template.thumbnail.helpers
  player: () ->
    for player in this.players
      if player.userId == Meteor.userId()
        return player;
  
  specialRules: () ->
    r = []
    for rule in Object.keys(this.board.specialRules)
      r.push
        name: Board.SPECIAL_RULE_NAME[rule]
        desc: Board.SPECIAL_RULE_DESC[rule]
      
    return r;
    
  hasSpecialRules: () ->
    return Object.keys(this.board.specialRules).length > 0
    
Template._startpoint.helpers
  position: (tileSize) ->
    return cssPosition(this.x,this.y,3,3, tileSize)

@cssPosition = (x,y, offsetX, offsetY, tileSize) ->
  coord = calcPosition(x, y, offsetX, offsetY, tileSize)
  return "top: #{coord.y}px; left:#{coord.x}px;"

@calcPosition = (x, y, offsetX=0, offsetY=0, tileSize=50) ->
  x = (tileSize*x)+offsetX
  y = (tileSize*y)+offsetY
  return {x: x, y: y}