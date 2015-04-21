class @GameAI
  @play: (gameId) ->
    console.log "starting AI #{gameId}"
    aiPlayers = Players.find({userId: -1, gameId: gameId}).fetch()
    console.log "found #{aiPlayers.length} AI players"
    for player in aiPlayers
      console.log "choosing random card for player", player
      playerCards = _.shuffle(Cards.findOne({playerId: player._id}).handCards)
      for i in [0..player.notLockedCnt()]
        console.log "playerCards", playerCards
        randomCard = playerCards.shift()
        console.log "choose card", randomCard
        player.chooseCard randomCard, i
      CardLogic.submitCards player
      player.chat 'submitted cards'