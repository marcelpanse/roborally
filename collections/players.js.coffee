player = 
  game: ->
    Games.findOne @gameId
  board: ->
    Games.findOne(@gameId).board()
  tile: ->
    @board().getTile @position.x, @position.y
  getHandCards: ->
    c = Cards.findOne(playerId: @_id)
    if c then c.handCards else []
  getChosenCards: ->
    c = Cards.findOne(playerId: @_id)
    if c then c.chosenCards else []
  hasOptionCard: (optionName) ->
    @optionCards[optionName]
  updateHandCards: (cards) ->
    Cards.upsert { playerId: @_id }, $set: handCards: cards
    return
  chooseCard: (card, index) ->
    cards = @getChosenCards()
    inc = 0
    if cards[index] == CardLogic.EMPTY
      inc = 1
    cards[index] = card
    console.log 'update chosen cards', index, card
    Cards.update { playerId: @_id }, $set: chosenCards: cards
    @cards[index] = CardLogic.COVERED
    Players.update @_id,
      $set: cards: @cards
      $inc: chosenCardsCnt: inc
    return
  unchooseCard: (index) ->
    cards = @getChosenCards()
    if cards[index] != CardLogic.EMPTY
      cards[index] = CardLogic.EMPTY
      Cards.update { playerId: @_id }, $set: chosenCards: cards
      @cards[index] = CardLogic.EMPTY
      Players.update @_id,
        $set: cards: @cards
        $inc: chosenCardsCnt: -1
    return
  isOnBoard: ->
    a = @board().onBoard(@position.x, @position.y)
    if !a or @tile().type == Tile.LIMBO
      console.log 'Player fell off the board', @name
    a
  isOnVoid: ->
    a = @tile().type == Tile.VOID
    if a
      console.log 'Player fell into the void', @name
    a
  updateStartPosition: (position) ->
    if position?
      @start = position
    else
      @start =
        x: @position.x
        y: @position.y
  move: (step) ->
    @position.x += step.x
    @position.y += step.y
    return
  rotate: (rotation) ->
    @direction += rotation + 4
    @direction %= 4
    return
  chat: (msg, debug_info) ->
    msg = @name + ' ' + msg
    Chat.insert
      gameId: @gameId
      message: msg
      submitted: (new Date).getTime()
    if debug_info != undefined
      msg += ' ' + debug_info
    console.log msg
    return
  togglePowerDown: ->
    switch @powerState
      when GameLogic.DOWN
        @powerState = GameLogic.ON
      when GameLogic.ON
        @powerState = GameLogic.DOWN
      when GameLogic.OFF
        @powerState = GameLogic.ON
    console.log 'new power state ' + @powerState
    Players.update @_id, $set: powerState: @powerState
    @powerState
  isPoweredDown: ->
    @powerState == GameLogic.OFF
  lockedCnt: ->
    Math.max 0, GameLogic.CARD_SLOTS + @damage - (CardLogic._MAX_NUMBER_OF_CARDS)
  notLockedCnt: ->
    GameLogic.CARD_SLOTS - @lockedCnt()
  notLockedCards: ->
    if @lockedCnt() == GameLogic.CARD_SLOTS
      []
    else
      @getChosenCards().slice 0, Math.max(@getChosenCards.length, @notLockedCnt())
  playedCards: ->
    @getChosenCards().slice 0, @playedCardsCnt
  isActive: ->
    !@isPoweredDown() and !@needsRespawn and @lives > 0
  addDamage: (inc) ->
    if @hasOptionCard('ablative_coat')
      if !@ablativeCoat
        @ablativeCoat = 0
      @ablativeCoat++
      if @ablativeCoat == 3
        @ablativeCoat = null
        @discardOptionCard 'ablative_coat'
      Players.update @_id, $set:
        ablativeCoat: @ablativeCoat
        optionCards: @optionCards
    else
      @damage += inc
      if @isPoweredDown() and @lockedCnt() > 0
        # powered down robot has no cards so we have to draw from deck to get locked cards
        deck = @game().getDeck()
        chosenCards = @getChosenCards()
        i = 0
        while i < @lockedCnt()
          @cards[@notLockedCnt() + i] = deck.cards.shift()
          chosenCards[@notLockedCnt() + i] = @cards[@notLockedCnt() + i]
          i++
        Deck.update deck._id, deck
        Players.update @_id, this
        Cards.update { playerId: @_id }, $set: chosenCards: chosenCards
    return
  addRobotLaserDamage: () ->
    damage = if @hasOptionCard('double-barreled_laser') then 2 else 1
    if @board().specialRules[Board.SPECIAL_RULE.DOUBLED_LASERS]
      damange = damage * 2
    @addDamage(damage)
  
  drawOptionCard: ->
    gameId = @game()._id
    optionCards = Deck.findOne(gameId: gameId).optionCards
    optionId = optionCards.pop()
    @optionCards[CardLogic.getOptionName(optionId)] = true
    Deck.update { gameId: gameId }, $set: optionCards: optionCards
    return
  discardOptionCard: (name) ->
    gameId = @game()._id
    delete optionCards.name
    discarded = Deck.findOne(gameId: gameId).discardedOptionCards
    discarded.push CardLogic.getOptionId(name)
    Deck.update { gameId: gameId }, $set: discardedOptionCards: discarded
    return
  resetAfterTurn: ->
    @selectLaserOption = false
    @optionStates.radioControlledBy = null
  resetAfterDeath: ->
    if @hasOptionCard('superior_archive')
        @damage = 0
    else
      @damage = 2
    @optionCards = {}
    @optionStates = {}
  save: ->
    Players.update(@_id, @)
  set: (args) ->
    Players.update this._id,
      $set:
        args

@Players = new Meteor.Collection 'players',
  transform: (doc) ->
    newInstance = Object.create(player)
    _.extend newInstance, doc

Players.allow
  insert: (userId, doc) ->
    false
  update: (userId, doc) ->
    false
  remove: (userId, doc) ->
    false

