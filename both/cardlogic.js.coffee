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
    #grab card from deck, so it can't be handed out twice
    handCards.push deck.cards.shift() for i in [1..nrOfNewCards]
    console.log('handCards ' + handCards.length)

    Cards.update {playerId: player._id},
      $set:
        handCards: handCards
    Deck.update(deck._id, deck)

  @submitCards: (player) ->
    if player.isPoweredDown()
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
      @startTimer player.game()
      GameAI.play player.gameId

  @startTimer: (game) ->
    # start timer
    Games.update(game._id, {$set: {timer: 1}})
    Meteor.setTimeout ->
      if Games.findOne(game._id).timer == 1
        console.log("time up! setting timer to 0")
        Games.update(game._id, {$set: {timer: 0}})

        # wait for player to auto-submit selected cards..
        Meteor.setTimeout ->
          # if nothing happened the system to should auto-submit random cards..
          if Players.find({gameId: game._id, submitted: true}).count() == 1
            unsubmittedPlayer = Players.findOne({gameId: game._id, submitted: false})
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



  @cardType:  (cardId, playerCnt) ->
    deck = if playerCnt <= 8 then @_8_deck else @_12_deck
    cnt  = 0
    for cardTypeCnt, index in deck
      cnt += cardTypeCnt
      if cardId < cnt
        return @_cardTypes[index]

  @priority: (index) ->
    (index+1)*10
