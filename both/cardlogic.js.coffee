class @CardLogic
  @_MAX_NUMBER_OF_CARDS = 9
  @EMPTY   = -1
  @COVERED = -2
  @DAMAGE  = -3
  @RANDOM  = -4

  @_cardTypes =
    0: {direction: 2, position: 0, name: "u-turn"}
    1: {direction: 1, position: 0, name: "turn-right"}
    2: {direction: -1, position: 0, name: "turn-left"}
    3: {direction: 0, position: -1, name: "step-backward"}
    4: {direction: 0, position: 1, name: "step-forward"}
    5: {direction: 0, position: 2, name: "step-forward-2"}
    6: {direction: 0, position: 3, name: "step-forward-3"}

  @_8_deck = [
    6,  # u turn
    18, # right turn
    18, # left turn
    6,  # step back
    18, # step 1
    12, # step 2
    6   # step 3
  ]

  @_12_deck = [
    9,  # u turn
    27, # right turn
    27, # left turn
    9,  # step back
    27, # step 1
    18, # step 2
    9   # step 3
  ]

  @discardCards: (game, player) ->
    deck = game.getDeck()

    if playerCards = Cards.findOne({playerId: player._id})
      for unusedCard in playerCards.handCards
        if unusedCard >= 0
          deck.cards.push unusedCard
      chosenCards = playerCards.chosenCards
      for discardCard, i in player.notLockedCards()
        # Rule note: You don't keep a discard pile. You always use the complete deck
        if discardCard >= 0
          deck.cards.push discardCard
        player.cards[i] = @EMPTY
        chosenCards[i] = @EMPTY

      Players.update player._id,
        $set:
          cards: player.cards
          playedCardsCnt: 0,
          chosenCardsCnt: player.lockedCnt()
      Cards.update {playerId: player._id},
        $set:
          handCards: [],
          chosenCards: chosenCards

    console.log "Returned cards, new total: "+deck.cards.length
    deck.cards = _.shuffle(deck.cards)
    Deck.upsert({gameId: game._id}, deck)

  @dealCards: (game, player) ->
    deck = game.getDeck()
    handCards = []

    #for every damage you get a card less
    nrOfNewCards = (@_MAX_NUMBER_OF_CARDS - player.damage)
    if player.hasOptionCard('extra_memory')
      nrOfNewCards++
    #grab card from deck, so it can't be handed out twice
    handCards.push deck.cards.pop() for i in [1..nrOfNewCards]
    console.log('handCards ' + handCards.length)

    Cards.update {playerId: player._id},
      $set:
        handCards: handCards
    Deck.update(deck._id, deck)

  @submitCards: (player) ->
    if (player.isPoweredDown())
      Players.update player._id,
        $set:
          submitted: true
          damage: 0
    else
      approvedCards = verifySubmittedCards(player)

      Players.update player._id,
        $set:
          submitted: true,
          optionalInstantPowerDown: false,
          cards: approvedCards

    playerCnt = Players.find({gameId: player.gameId, lives: {$gt: 0}}).count()
    readyPlayerCnt = Players.find({gameId: player.gameId, submitted: true, lives: {$gt: 0}}).count()
    if readyPlayerCnt == playerCnt
      Games.update(player.gameId, {$set: {timer: -1}})
      GameState.nextGamePhase(player.gameId)
    else if readyPlayerCnt == playerCnt-1
      # start timer
      Games.update(player.gameId, {$set: {timer: 1}})
      Meteor.setTimeout ->
        if Games.findOne(player.gameId).timer == 1
          console.log("time up! setting timer to 0")
          Games.update(player.gameId, {$set: {timer: 0}})

          # wait for player to auto-submit selected cards..
          Meteor.setTimeout ->
            # if nothing happened the system to should auto-submit random cards..
            if Players.find({gameId: player.gameId, submitted: true}).count() == 1
              unsubmittedPlayer = Players.findOne({gameId: player.gameId, submitted: false})
              CardLogic.submitCards(unsubmittedPlayer)
              console.log("Player " + unsubmittedPlayer.name + " did not respond, submitting random cards")
          , 2500

      , GameLogic.TIMER * 1000

  verifySubmittedCards = (player) ->
    # check if all played cards are available from original hand...
    # Except locked cards, those are not in the hand.
    availableCards = player.getHandCards()
    submittedCards = player.getChosenCards()
    for card, i in player.notLockedCards()
      found = false
      if card >= 0
        for j in [0..availableCards.length-1]
          if card == availableCards[j]
            availableCards.splice(j, 1)
            found = true
            break
        if !found
          console.log("illegal card detected: "+card+"! (removing card)")
      else
        console.log("Not enough cards submitted")

      if card<0 || !found
        # grab card from hand
        cardIdFromHand = availableCards.splice(_.random(0, availableCards.length-1), 1)[0]
        console.log("Handing out random card", cardIdFromHand)
        submittedCards[i] = cardIdFromHand
        player.cards[i] = CardLogic.RANDOM

    Cards.update({playerId: player._id}, $set:
      handCards: availableCards
      chosenCards: submittedCards
    )
    player.cards


  @getOptionName: (index) ->
    @_option_deck[index][0]

  @getOptionTitle: (name) ->
    name.replace('/_/g',' ').replace /\w\S*/g, (txt) ->
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()

  @getOptionId: (name) ->
    for option, id in @_option_deck
      if option[0] == name
        return id

  @getOptionDesc: (name) ->
    return @_option_deck[@getOptionId(name)][1]

  @cardType:  (cardId, playerCnt) ->
    deck = if playerCnt <= 8 then @_8_deck else @_12_deck
    cnt  = 0
    for cardTypeCnt, index in deck
      cnt += cardTypeCnt
      if cardId < cnt
        return @_cardTypes[index]

  @priority: (index) ->
    (index+1)*10

  @_option_deck = [
    [ 'superior_archive',  "When reentering play after beeing destroyed, your robot doesn't receive the normal 20% damage" ]
    [ 'circuit_breaker',   "If you have 30% or more damage at the end of your turn, your robot will begin the next turn powered down" ]
    [ 'rear-firing_laser', "Your robot has a rear-firing laser in addition to its main laser. This laser follows all the same rules as the main laser" ]
    [ 'extra_memory', "You receive one extra Program card each turn."]
    [ 'high-power_laser', "Your robot's main laser can shoot through one wall or robot to get to a target robot. If you shoot through a robot, that robot also receives full damage. You may use this Option with Fire Control and/or Double-Barreled Laser."]
    [ 'double-barreled_laser', "Whenever your robot fires its main laser, it fires two shots instead of one. You may use this Option with Fire Control and/or High-Power Laser."]
    [ 'ramming_gear', "Whenever your robot pushes or bumps into another robot, that robot receives 10% damage."]
    [ 'mechanical_arm', "Your robot can touch a flag or repair site from 1 space away (diagonally or orthogonally), as long as there isn't a wall."]
    [ 'ablative_coat', "Absorbs the next 30% damage your robot receives."]
    ####### choose to use
    # 'recompile'
    #[ 'power-down_shield', ""
    # 'abort_switch'
    ###### additional move options
    # 'fourth_gear'
    # 'reverse_gear'
    # 'crab_legs'
    # 'brakes'
    ######## register options
    # 'dual_processor'
    # 'conditional_program'
    # 'flywheel'
    ######## alternative laser
    # 'mini_howitzer'
    # 'fire_control'
    # 'radio_control'
    # [ 'scrambler',    "Whenever you could fire your main laser at a robot, you may instead fire the Scrambler. This replaces the target's robots's next programmed card with the top Program card from the deck. You can't use this Option on the fifth register phase."]
    # [ 'tractor_beam', "Whenever you could fire your main laser at a robot that isn't in an adjacent space, you may instead fire the Tractor Beam. This moves the target robot 1 space toward your robot."]
    # [ 'pressor_beam', "Whenever you could fire your main laser at a robot, you may instead fire the Pressor Beam. This moves the target robot 1 space away from your robot."]
    ##### activate before submit
    # 'gyroscopic_stabilizer'
  ]
