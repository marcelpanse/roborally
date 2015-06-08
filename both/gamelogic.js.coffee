class @GameLogic 
  @UP = 0
  @RIGHT = 1
  @DOWN = 2
  @LEFT = 3
  @OFF = 4
  @ON = 5
  @TIMER = 30
  @CARD_SLOTS = 5

  @_CARD_PLAY_DELAY = 1000

  @playCard: (player, card, callback) ->
    if !player.needsRespawn
      console.log("trying to play next card for player #{player.name}")

      if card != CardLogic.EMPTY
        cardType = CardLogic.cardType(card, player.game().playerCnt())
        console.log("playing card #{cardType.name} for player #{player.name}")

        player.rotate cardType.direction

        if cardType.position == 0
          Meteor.wrapAsync(checkRespawnsAndUpdateDb)(player)
        else 
          step = Math.min(cardType.position, 1)
          for j in [0..Math.abs(cardType.position)-1]
            timeout = if j+1 < Math.abs(cardType.position) then 0 else @_CARD_PLAY_DELAY
            # don't delay if there is another step to execute
            players = Players.find({gameId: player.gameId}).fetch()
            executeStep(players, player, step)
            if player.needsRespawn
              break # player respawned, don't continue playing out this card.    
      else
        console.log("card #{card} is not playable for player #{player.name}")

    callback()

  @executeRollers: (players, callback) ->
    roller_moves = []
    for player in players
      #check if is on roller
      tile = player.tile()
      moving = (tile.type == Tile.ROLLER)
      if !player.needsRespawn
        roller_moves.push(rollerMove(player, tile, moving))

    tryToMovePlayersOnRollers(roller_moves)
    board = players[0].board()
    if board.specialRules[Board.SPECIAL_RULE.MOVING_TARGETS]
      game = players[0].game()
      for cp in game.checkpoints
        cp_tile = board.getTile(cp.x,cp.y);
        if cp_tile.type == Tile.ROLLER
          moveCheckpoint(board, cp, cp_tile.move)
        
      Games.update game._id, 
        $set: 
          checkpoints: game.checkpoints
    callback()

  # move players 2nd step in roller direction; 1st step is done by executeRollers,
  @executeExpressRollers: (players, callback) ->
    roller_moves = []
    for player in players
      #check if is on roller
      tile = player.tile()
      moving = (tile.type == Tile.ROLLER && tile.speed == 2)
      if !player.needsRespawn
        roller_moves.push(rollerMove(player, tile, moving))
      
    tryToMovePlayersOnRollers(roller_moves)
    board = players[0].board()
    if board.specialRules[Board.SPECIAL_RULE.MOVING_TARGETS]
      game = players[0].game()
      for cp in game.checkpoints
        cp_tile = board.getTile(cp.x,cp.y)
        if (cp_tile.type == Tile.ROLLER && tile.speed == 2) 
          moveCheckpoint(board, cp, cp_tile.move)
      Games.update game._id, 
        $set: 
          checkpoints: game.checkpoints
    callback()

  @executeGears: (players, callback) ->
    for player in players
      if player.tile().type == Tile.GEAR
        player.rotate(player.tile().rotate)
        Players.update(player._id, player)
    callback()

  @executePushers: (players, callback) ->
    for player in players
      tile = player.tile()
      if tile.type == Tile.PUSHER && player.game().playPhaseCount % 2 == tile.pusher_type 
        tryToMovePlayer(players, player, tile.move)
    callback()

  @executeLasers: (players, callback) ->
    victims = []
    selectLaserOption = false
    for player in players
      tile = player.tile()
      if tile.damage > 0 
        player.addDamage tile.damage
        player.chat('was hit by a laser, total damage: '+ player.damage)
        checkRespawnsAndUpdateDb(player)
  
      if !player.isPoweredDown() && !player.needsRespawn
        GameLogic.shootRobotLaser(players, player)
        if player.hasOptionCard('rear-firing_laser')
          player.rotate(2)
          GameLogic.shootRobotLaser(players, player)
          player.rotate(2)
        
        if player.victims.length > 0 && (
          player.hasOptionCard('mini_howitzer') ||
          player.hasOptionCard('fire_control')  ||
          player.hasOptionCard('radio_control') ||
          (player.hasOptionCard('scrambler') && player.game().playPhaseCount < 5) ||
          player.hasOptionCard('tractor_beam')  ||
          player.hasOptionCard('pressor_beam') )

          selectLaserOption = true
          player.set
            selectLaserOption: true
          
          
    if (selectLaserOption)
      player.game().setPlayPhase(GameState.PLAY_PHASE.LASER_OPTIONS)
      player.game().nextPlayPhase()
      callback()
    else 
      GameLogic.executeLaserDamage(players, callback)
    

  @executeLaserDamage: (players, callback) ->
    for player in players
      for victim in player.victims
        switch player.laserOption
          when 'mini_howitzer'
            tryToMovePlayer(players, victim, Board.to_step(player.direction) )
            player.addRobotLaserDamage()
            if player.optionStates.miniHowitzerCnt?
              player.optionStates.miniHowitzerCnt++
            else
              player.optionStates.miniHowitzerCnt = 1
            if player.optionStates.miniHowitzerCnt == 5
              player.optionStates.miniHowitzerCnt  = 0
              player.discardOptionCard('mini_howitzer')
            
            player.save()
          when 'fire_control'
            ''
          when 'radio_control'
            victim.optionStates.radioControlledBy = player._id
            victim.save()
          when 'scrambler'
            victim.optionStates.scrambledRegister = player.game().playPhaseCount + 1
            victim.save()
          when 'tractor_beam'
            if Math.abs(victim.position.x - player.position.x) > 1 || Math.abs(victim.position.y - player.position.y) > 1
              tryToMovePlayer(players, victim, Board.to_step( (player.direction+2) % 4) )
          when 'pressor_beam' 
            tryToMovePlayer(players, victim, Board.to_step(player.direction) )
          else
            player.addRobotLaserDamage()
            
        checkRespawnsAndUpdateDb(victim)
    players[0].game().setPlayPhase(GameState.PLAY_PHASE.CHECKPOINTS)
    players[0].game().nextPlayPhase()
    if callback
      callback()
          


  @executeRepairs: (players, callback) ->
    for player in players
      if player.hasOptionCard('mechanical_arm')
        for x in [-1..1]
          for y in [-1..1]  
            pos = { x: player.position.x+x, y: player.position.y+y }
            executeRepairsWithPositions(player, pos)
      else 
        executeRepairsWithPosition(player, player.position)

      player.resetAfterTurn()
      player.save()

    callback()

  @checkCheckpoints: (player,game) ->
    if player.hasOptionCard('mechanical_arm')
      for x in [-1..1]
        for y in [-1..1]
          pos = { x: player.position.x+x, y: player.position.y+y }
          checkCheckpointsWithPosition(game, player, pos)
    else
      checkCheckpointsWithPosition(game, player, player.position)

  @shootRobotLaser: (players, player) ->
    step = {x:0, y:0}
    board = player.board()
    switch player.direction
      when GameLogic.UP
        step.y = -1
      when GameLogic.RIGHT
        step.x = 1
      when GameLogic.DOWN
        step.y = 1
      when GameLogic.LEFT
        step.x = -1

    x = player.position.x
    y = player.position.y
    shotDistance = 0
    highPower = player.hasOptionCard('high-power_laser')
    victims = []
    while board.onBoard(x+step.x,y+step.y) && (board.canMove(x, y, step) || highPower) 
      if highPower && !board.canMove(x,y,step)
        highPower = false
      x += step.x
      y += step.y
      shotDistance++
      victim = isPlayerOnTile(players,x,y)
      if (victim) 
        debug_info = "Shot: (#{player.position.x}, #{player.position.y}) -> (#{x},#{y})"
        victim.chat("was shot by #{player.name}", debug_info)
        victims.push victim
        if (!highPower)
          break
        highPower = false
    player.set  
      shotDistance:shotDistance
      victims: victims
    return (victims.length > 0)

  checkCheckpointsWithPosition = (game, player, position) ->
    for cp in game.checkpoints
      if cp.x == position.x && cp.y == position.y
        player.updateStartPosition position
        if cp.number == player.visited_checkpoints+1
          player.visited_checkpoints++
        player.save()
    
    tile = game.board().getTile(position.x, position.y)
    if tile.repair
      player.updateStartPosition position
      player.save()

  executeRepairsWithPosition = (player, position) ->
    board = player.board()
    tile = board.getTile(position.x, position.y)
    if tile.repair
      if board.specialRules[Board.SPECIAL_RULE.OPTION_WORLD]
        player.drawOptionCard()
      else if player.damage > 0
        player.damage--
      if tile.option
        player.drawOptionCard()
        if board.specialRules[Board.SPECIAL_RULE.OPTION_WORLD]
          player.drawOptionCard()
      player.save()
    else 
      for cp in player.game().checkpoints
        if cp.x == position.x && cp.y == position.y
          if board.specialRules[Board.SPECIAL_RULE.OPTION_WORLD]
            player.drawOptionCard()
          else if player.damage > 0
            player.damage--
          player.save()

  executeStep = (players, player, direction) ->  # direction = 1 for step forward, -1 for step backwards
    step = { x: 0, y: 0 }
    switch player.direction
      when GameLogic.UP
        step.y = -1 * direction
      when GameLogic.RIGHT
        step.x = direction
      when GameLogic.DOWN
        step.y = direction
      when GameLogic.LEFT
        step.x = -1 * direction
    tryToMovePlayer(players, player, step)

  tryToMovePlayer = (players, p, step) ->
    board = p.board()
    makeMove = true
    if step.x != 0 || step.y != 0
      console.log("trying to move player "+p.name+" to "+ (p.position.x+step.x)+","+(p.position.y+step.y))

      if board.canMove(p.position.x, p.position.y, step)
        pushedPlayer = isPlayerOnTile(players, p.position.x + step.x, p.position.y + step.y)
        if pushedPlayer != null 
          console.log("trying to push player "+pushedPlayer.name)
          if p.hasOptionCard('ramming_gear')
            pushedPlayer.addDamage(1)
          makeMove = tryToMovePlayer(players, pushedPlayer, step)
        
        if makeMove
          console.log("moving player "+p.name+" to "+ (p.position.x+step.x)+","+(p.position.y+step.y))
          p.move step
          Meteor.wrapAsync(checkRespawnsAndUpdateDb)(p)
          return true

    return false;

  rollerMove = (player, tile, is_moving) ->
    if is_moving
      return {
        player: player,
        x: player.position.x+tile.move.x,
        y: player.position.y+tile.move.y,
        rotate: tile.rotate,
        step:tile.move,
        canceled: false
      }
    else # to detect conflicts add non-moving players
      return {
        player: player,
        x: player.position.x,
        y: player.position.y,
        canceled: true
      }

  moveCheckpoint = (board, checkpoint, move) ->
    new_x = checkpoint.x + move.x
    new_y = checkpoint.y + move.y
    new_cp_tile = board.getTile(new_x,new_y)
    if new_cp_tile.type == Tile.LIMBO || new_cp_tile.type == Tile.VOID 
      index = checkpoint.number-1
      new_x = board.checkpoints[index].x
      new_y = board.checkpoints[index].y
    game.checkpoints[i].x = new_x
    game.checkpoints[i].y = new_y

  tryToMovePlayersOnRollers = (moves) ->
    move_canceled = true
    max = 0
    while (move_canceled) # if a move was canceled we have to check for other conflicts again
      max++
      if max > 100
        console.log("Infinite loop detected.. cancelling..")
        break
      
      move_canceled = false
      for i in [0..moves.length-1]
        if i+1 < moves.length
          for j in [i+1..moves.length-1]
            if (moves[i].x == moves[j].x && moves[i].y == moves[j].y) 
              moves[i].canceled = true
              moves[j].canceled = true
              moves[i].x = moves[i].player.position.x
              moves[j].x = moves[j].player.position.x
              moves[i].y = moves[i].player.position.y
              moves[j].y = moves[j].player.position.y
              move_canceled = true
    for roller_move in moves
      if !roller_move.canceled
        #move player 1 step in roller direction and rotate
        roller_move.player.move(roller_move.step)
        roller_move.player.rotate(roller_move.rotate)
        checkRespawnsAndUpdateDb(roller_move.player)

  isPlayerOnTile = (players, x, y) ->
    found = null
    for player in players
      if player.position.x == x && player.position.y == y && !player.needsRespawn
        found = player
    return found
  

  checkRespawnsAndUpdateDb = (player, callback) ->
    console.log "#{player.name} Player.position (#{player.position.x},#{player.position.y}) #{player.isOnBoard()}|'player.isOnVoid()"
    if player.lives > 0 && !player.needsRespawn && (!player.isOnBoard() || player.isOnVoid() || player.damage > 9 )
      
      player.resetAfterDeath()
      player.lives--
      player.needsRespawn = true
      player.optionalInstantPowerDown = true
      player.save()
      if player.lives > 0
        game = player.game()
        game.waitingForRespawn.push(player._id)
        Games.update(game._id, game);
      player.chat('died!', "(lives: #{player.lives}, damage: #{player.damage})")
      Meteor.wrapAsync(removePlayerWithDelay)(player)
    else 
      console.log("updating position", player.name)
      player.save()
    if callback
      callback()

  removePlayerWithDelay = (player, callback) ->
    Meteor.setTimeout ->
      player.position.x = player.board().width-1
      player.position.y = player.board().height
      player.direction = GameLogic.UP
      player.save()
      console.log("removing player", player.name)
      callback()
    , @_CARD_PLAY_DELAY

  @respawnPlayerAtPos: (player,x,y) ->
    player.position.x = x
    player.position.y = y
    player.save()
    console.log("respawning player #{player.name} at #{x},#{y}")

  @respawnPlayerWithDir: (player,dir) ->
    player.direction = dir
    player.needsRespawn = false
    player.save()
