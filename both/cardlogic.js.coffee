class @CardLogic
  @_MAX_NUMBER_OF_CARDS = 9
  @_CARD_PLAY_DELAY = 500
  EMPTY = -1
  COVERED = -2

  @_cardTypes =
    0: {direction: 2, position: 0, name: "U_TURN"}
    1: {direction: 1, position: 0, name: "TURN_RIGHT"}
    2: {direction: -1, position: 0, name: "TURN_LEFT"}
    3: {direction: 0, position: -1, name: "STEP_BACKWARD"}
    4: {direction: 0, position: 1, name: "STEP_FORWARD"}
    5: {direction: 0, position: 2, name: "STEP_FORWARD_2"}
    6: {direction: 0, position: 3, name: "STEP_FORWARD_3"}
  
  @discardCards: (game, players) ->
    deck = game.getDeck()
    if !deck?
      for player in players
        for unusedCard in player.getHandCards()
          deck.cards.push unusedCard
    
        for discardCard, i in player.notLockedCards()
          # Rule note: You don't keep a discard pile. You always use the complete deck
          deck.cards.push discardCard
          player.submittedCards[i] = null

        Players.update(player._id, {$set: {submittedCards: player.submittedCards}})
        player.updateHandCards([])
      
      console.log "Returned cards, new total: "+deck.cards.length
      Deck.upsert({gameId: game._id}, deck)

  @makeDeck: (gameId) ->
    deck = game.getDeck()
    if deck?
      deck.cards = _.shuffle(deck.cards)
      Deck.upsert({gameId: gameId}, deck)
    else
       Deck.upsert({gameId: gameId}, {$set: {cards: _.shuffle(_deck)}})
    return deck

  @dealCards: (player) ->
    deck = game.getDeck()
    playerCards = player.getCards()

    if !playerCards
      playerCards = 
        gameId: player.gameId, 
        playerId: player._id, 
        userId: player.userId, 
        cards: [],
        submittedCards: Array.apply(null, new Array(5))
    
    nrOfNewCards = (_MAX_NUMBER_OF_CARDS - player.damage) #for every damage you get a card less

    for card, i in playerCards.cards
      if card >= 0
        cardId = deck.cards.splice(0, 1)[0] #grab card from deck, so it can't be handed out twice
        playerCards.cards[i] = cardId
          
    player.updateCards playerCards    
    Deck.update(deck._id, deck)

  @selectCard: (player, card, index) ->
    if index <= player.un
    player.submittedCards[index] = COVERED

    #TODO update player
    # don't allow update of locked cards

  @deselectCard: (player, index) ->
    player.submittedCards[index] = null

  @submitCards: (player) ->
    console.log('player ' + player.name + ' submitted cards: ')

    if (player.isPoweredDown()) 
      Players.update(player._id, {$set: {
        submitted: true,
        damage: 0,
      }})
    else
      approvedCards = verifySubmittedCards(player)

      Players.update(player._id, {$set: {
        submittedCards: approvedCards
        submitted: true,
        optionalInstantPowerDown: false
      }})

    playerCnt = Players.find({gameId: player.gameId}).count();
    readyPlayerCnt = Players.find({gameId: player.gameId, submitted: true}).count();
    if readyPlayerCnt == playerCnt
      Games.update(player.gameId, {$set: {timer: -1}})
      GameState.nextGamePhase(player.gameId)
    else if readyPlayerCnt == playerCnt-1
      # start timer
      Games.update(player.gameId, {$set: {timer: 1}})
      Meteor.setTimeout ->
        if Games.findOne(player.gameId).timer == 1
          console.log("time up! setting timer to 0");
          Games.update(player.gameId, {$set: {timer: 0}})

          # wait for player to auto-submit selected cards..
          Meteor.setTimeout ->
            # if nothing happened the system to should auto-submit random cards..
            if PlayErs.find({gameId: player.gameId, submitted: true}).count() == 1
              unsubmittedPlayer = Players.findOne({gameId: player.gameId, submitted: false});
              CardLogic.submitCards(unsubmittedPlayer, []);
              console.log("Player " + unsubmittedPlayer.name + " did not respond, submitting random cards")
          , 2500

      , GameLogic.TIMER * 1000

  verifySubmittedCards = (player) ->
    # check if all played cards are available from original hand...
    # Except locked cards, those are not in the hand.
    availableCards = player.getHandCards()
      
    for card, i in player.notLockedCards()
      found = false
      if card 
        for j in [0,availableCards.length-1]
          if card.cardId == availableCards[j].cardId
            availableCards.splice(j, 1);
            console.log(_cardTypes[card.cardType].name + ' ')
            found = true;
            break;
        if !found
          console.log("illegal card detected! (removing card)")

      else 
        console.log("Not enough cards submitted")

      if !card || !found
        cardFromHand = availableCards.splice(_.random(0, availableCards.length-1), 1)[0] # grab card from hand
        console.log("Handing out random card", cardFromHand)
        player.submittedCards[i] = 
          cardId: Meteor.uuid() 
          cardType: cardFromHand.cardType
          priority: cardFromHand.priority

    player.updateHandCards(availableCards)
    return player.submittedCards

         
  @playCard: (player, card, callback) ->
    if !player.needsRespawn
      console.log("trying to play next card for player " + player.name);

      if !card?
        cardType = _cardTypes[card.cardType];
        console.log('playing card ' + cardType.name + ' for player ' + player.name)

        player.rotate(cardType.direction)

        if cardType.position == 0
          Meteor.wrapAsync(checkRespawnsAndUpdateDb)(player, _CARD_PLAY_DELAY);
        else 
          step = Math.min(cardType.position, 1)
          for j in [0..(Math.abs(cardType.position)-1)]
            timeout = if j+1 < Math.abs(cardType.position) then 0 else _CARD_PLAY_DELAY 
            #don't delay if there is another step to execute
            players = Players.find({gameId: player.gameId}).fetch();
            executeStep(players, player, step, timeout)
            if player.needsRespawn
              break # player respawned, don't continue playing out this card.
            
      else 
        console.log("card is not playable " + card + " player " + player.name);
  
    callback()

  @cardType:  (index, playerCnt) ->
    deck = if playerCnt <= 8 then @_8_deck else @_12_deck
    cnt  = 0
    for cardTypeCnt, index in deck
      cnt += cardTypeCnt
      if index < cnt
        return _cardTypes[index]

  @priority: (index) ->
    (index+1)*10

  @_8_deck = [
    6,  # u turn
    36, # turnturn
    6,  # step_back
    18, # step 1
    12, # step 2
    6   # step 3
  ]
  @_12_deck = [
    9,  # u turn
    54, # turnturn
    9,  # step_back
    27, # step 1
    18, # step 2
    9   # step 3
  ]
  