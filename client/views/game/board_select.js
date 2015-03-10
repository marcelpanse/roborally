Template.boardselect.helpers({
  boards: function() {
    var game = Games.findOne({userId: Meteor.userId()});
    var b = [];
    for (var i in BoardBox.CATALOG) {
      var board = BoardBox.getBoard(i);
      var css_class = '';
      if (Number(game.boardId) === Number(i)) {
        css_class = 'selected';
      }

      b.push( { gameId: game._id,
                width: board.width*24+4,
                height: board.height*24+4,
                board: board,
                extra_class: css_class,
                show_start: true
              });
    }
    return b;
  },
});

Template.boardselect.events({
  'click .board-thumbnail': function(e) {
    e.preventDefault();

    var gameId = this.gameId;
    Meteor.call('selectBoard', this.board.name, gameId, function(error) {
      if (error)
        alert(error.reason);
      Router.go('game.page', {_id: gameId});
    });
  }
});
