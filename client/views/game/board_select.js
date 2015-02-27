Template.boardselect.helpers({
  boards: function() {
    var game = Games.findOne({userId: Meteor.userId()});
    var b = [];
    for (var i in Tiles.BOARD_NAMES) {
      var name = Tiles.BOARD_NAMES[i];
      var temp = Tiles.boards[name]();  
      var css_class = '';
      if (Number(game.boardId) === Number(i)) {
        css_class = 'selected';
      }

      b.push( { tiles: temp.tiles, 
                width: temp.width*20+4, 
                height: temp.height*20+4,
                name: name,
                extra_class: css_class,
                min: temp.min_player,
                max: temp.max_player 
              });
    }
    return b;
  },
});


Template.boardselect.events({
  'click .board-thumbnail': function(e) {
    e.preventDefault();
    var game = Games.findOne({userId: Meteor.userId()});

    Meteor.call('selectBoard', this.name, game._id, function(error) {
      if (error)
        alert(error.reason);
      Router.go('game.page', {_id: game._id});
    });

  }
});


