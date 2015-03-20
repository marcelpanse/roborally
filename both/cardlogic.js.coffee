class @CardLogic
  @_MAX_NUMBER_OF_CARDS = 9
  @_CARD_PLAY_DELAY = 500

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
          deck.cards.push
            priority: unusedCard.priority, 
            cardType: unusedCard.cardType

    
        for discardCard, i in player.notLockedCards()
          # Rule note: You don't keep a discard pile. You always use the complete deck
          deck.cards.push 
            priority: discardCard.priority, 
            cardType: discardCard.cardType
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
        submittedCards: Array.apply(null, Array(5))
    
    nrOfNewCards = (_MAX_NUMBER_OF_CARDS - player.damage) #for every damage you get a card less

    for card, i in playerCards.cards
      if !card
        cardFromDeck = deck.cards.splice(0, 1)[0] #grab card from deck, so it can't be handed out twice
        playerCards.cards[i] = 
          cardId: Meteor.uuid(),
          cardType: cardFromDeck.cardType,
          priority: cardFromDeck.priority

    player.updateCards playerCards    
    Deck.update(deck._id, deck)

  @selectCard: (player, card, index) ->
    player.submittedCards[index] = card
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

  @_deck = [
    { priority:  10, cardType: 0 },
    { priority:  20, cardType: 0 },
    { priority:  30, cardType: 0 },
    { priority:  40, cardType: 0 },
    { priority:  50, cardType: 0 },
    { priority:  60, cardType: 0 },
    { priority:  70, cardType: 2 },
    { priority:  80, cardType: 1 },
    { priority:  90, cardType: 2 },
    { priority: 100, cardType: 1 },
    { priority: 110, cardType: 2 },
    { priority: 120, cardType: 1 },
    { priority: 130, cardType: 2 },
    { priority: 140, cardType: 1 },
    { priority: 150, cardType: 2 },
    { priority: 160, cardType: 1 },
    { priority: 170, cardType: 2 },
    { priority: 180, cardType: 1 },
    { priority: 190, cardType: 2 },
    { priority: 200, cardType: 1 },
    { priority: 210, cardType: 2 },
    { priority: 220, cardType: 1 },
    { priority: 230, cardType: 2 },
    { priority: 240, cardType: 1 },
    { priority: 250, cardType: 2 },
    { priority: 260, cardType: 1 },
    { priority: 270, cardType: 2 },
    { priority: 280, cardType: 1 },
    { priority: 290, cardType: 2 },
    { priority: 300, cardType: 1 },
    { priority: 310, cardType: 2 },
    { priority: 320, cardType: 1 },
    { priority: 330, cardType: 2 },
    { priority: 340, cardType: 1 },
    { priority: 350, cardType: 2 },
    { priority: 360, cardType: 1 },
    { priority: 370, cardType: 2 },
    { priority: 380, cardType: 1 },
    { priority: 390, cardType: 2 },
    { priority: 400, cardType: 1 },
    { priority: 410, cardType: 2 },
    { priority: 420, cardType: 1 },
    { priority: 430, cardType: 3 },
    { priority: 440, cardType: 3 },
    { priority: 450, cardType: 3 },
    { priority: 460, cardType: 3 },
    { priority: 470, cardType: 3 },
    { priority: 480, cardType: 3 },
    { priority: 490, cardType: 4 },
    { priority: 500, cardType: 4 },
    { priority: 510, cardType: 4 },
    { priority: 520, cardType: 4 },
    { priority: 530, cardType: 4 },
    { priority: 540, cardType: 4 },
    { priority: 550, cardType: 4 },
    { priority: 560, cardType: 4 },
    { priority: 570, cardType: 4 },
    { priority: 580, cardType: 4 },
    { priority: 590, cardType: 4 },
    { priority: 600, cardType: 4 },
    { priority: 610, cardType: 4 },
    { priority: 620, cardType: 4 },
    { priority: 630, cardType: 4 },
    { priority: 640, cardType: 4 },
    { priority: 650, cardType: 4 },
    { priority: 660, cardType: 4 },
    { priority: 670, cardType: 5 },
    { priority: 680, cardType: 5 },
    { priority: 690, cardType: 5 },
    { priority: 700, cardType: 5 },
    { priority: 710, cardType: 5 },
    { priority: 720, cardType: 5 },
    { priority: 730, cardType: 5 },
    { priority: 740, cardType: 5 },
    { priority: 750, cardType: 5 },
    { priority: 760, cardType: 5 },
    { priority: 770, cardType: 5 },
    { priority: 780, cardType: 5 },
    { priority: 790, cardType: 6 },
    { priority: 800, cardType: 6 },
    { priority: 810, cardType: 6 },
    { priority: 820, cardType: 6 },
    { priority: 830, cardType: 6 },
    { priority: 840, cardType: 6 }
  ];