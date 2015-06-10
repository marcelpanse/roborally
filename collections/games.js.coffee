game =
  board: () ->
    BoardBox.getBoard(this.boardId)
  players: () ->
    Players.find({gameId: this._id}).fetch()
  playerCnt: () ->
    Players.find({gameId: this._id}).count()
  isPlayerOnTile: (x,y) ->
    found = null
    for player in this.players()
      if (player.position.x == x && player.position.y == y)
        found = player
    return found;
  start: () ->
    Deck.insert(@newDeck())
    checkpoints = []
    for cp in @board().checkpoints
      checkpoints.push(cp)
    checkpoints[checkpoints.length-1].finish = true
    Games.update this._id,
      $set:
        checkpoints: checkpoints
    for player, i in @players()
      start = @board().startpoints[i]
      player.position.x = start.x
      player.position.y = start.y
      player.direction = start.direction
      player.robotId = i
      player.start = start
      
      if @board().specialRules[Board.SPECIAL_RULE.START_WITH_OPTION]
        player.drawOptionCard()
      if @board().specialRules[Board.SPECIAL_RULE.INCURABLE_DAMAGED]
        player.damage = 2
        Games.update this._id,
          $set:
            no_powerdown: true
      player.optionCards['scrambler'] = true # just for testing. remove me!
      player.save()



  chat: (msg, debug_info) ->
    Chat.insert
      gameId: this._id,
      message: msg,
      submitted: new Date().getTime()
    if debug_info?
      msg += ' ' + debug_info
    console.log(msg)
  nextPlayPhase: (phase) ->
    if phase?
      this.setPlayPhase(phase)
    GameState.nextPlayPhase(this._id)
  nextGamePhase: (phase) ->
    if phase?
      this.setGamePhase(phase)
    GameState.nextGamePhase(this._id)
  nextRespawnPhase: (phase) ->
    if phase?
      this.setRespawnPhase(phase)
    GameState.nextRespawnPhase(this._id)
  setPlayPhase: (phase) ->
    Games.update this._id,
      $set:
        playPhase: phase
  setGamePhase: (phase) ->
    Games.update this._id,
      $set:
        gamePhase: phase
  setRespawnPhase: (phase) ->
    Games.update this._id,
      $set:
        respawnPhase: phase
  getDeck: () ->
    Deck.findOne({gameId: this._id}) || this.newDeck()
  newDeck: () ->
    deck = if this.playerCnt() <= 8
      CardLogic._8_deck
    else
      CardLogic._12_deck

    deckSize = 0
    for cardTypeCnt in deck
      deckSize += cardTypeCnt

    return {
      gameId: this._id,
      cards: [0..deckSize-1]
      optionCards: _.shuffle([0..CardLogic._option_deck.length-1])
      discardedOptionCards: []
    }
  startAnnounce: () ->
    Games.update this._id,
      $set:
        announce: true
  stopAnnounce: () ->
    Games.update this._id,
      $set:
        announce: false
  activePlayers: () ->
    Players.find
      gameId: this._id,
      needsRespawn: false,
      lives: {$gt: 0},
      powerState: {$ne:GameLogic.OFF}
    .fetch()
  livingPlayers: () ->
    Players.find
      gameId: this._id,
      lives: {$gt: 0},
    .fetch()
  playersOnBoard: () ->
    Players.find
      gameId: this._id,
      needsRespawn: false,
      lives: {$gt: 0},
    .fetch()



@Games = new Meteor.Collection 'games',
  transform: (doc) ->
    newInstance = Object.create(game)
    _.extend(newInstance, doc)


Games.allow
  insert: (userId, doc) ->
    return false
  update: (userId, doc) ->
    return false
  remove: (userId, doc) ->
    return ownsDocument(userId, doc)
