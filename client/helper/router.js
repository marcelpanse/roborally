Router.configure({
  layoutTemplate: 'applicationLayout',
  trackPageView: true
});

Router.route('/', {
  name: 'home.page',
  layoutTemplate: 'home',
  action: function() {
    analytics.page("home");
  }
});

Router.route('/online', {
  name: 'gamelist.page',
  loadingTemplate: 'loading',

  waitOn: function() {
    return Meteor.subscribe('games');
  },

  action: function() {
    this.render('gameList');
    this.render('gameItemPostForm', {to: 'rightPanel'});
  }
});

Router.route('/games/:_id', {
  name: 'game.page',
  loadingTemplate: 'loading',

  waitOn: function() {
    return [Meteor.subscribe('games'),
      Meteor.subscribe('players', this.params._id),
      Meteor.subscribe('chat', this.params._id)];
  },

  action: function() {
    this.render('chat', {
      data: function() {
        var game = Games.findOne(this.params._id);
        if (game === undefined) {
          Router.go('gamelist.page');
        } else if (game.started) {
          console.log('game started, routing to board');
          Router.go('board.page', {_id: this.params._id});
        } else {
          return {messages: Chat.find(), gameId: this.params._id};
        }
      }
    });
    this.render('gamePageActions', {
      to: 'rightPanel',
      data: function() {
        return Games.findOne(this.params._id);
      }
    });
    this.render('players', {
      to: 'rightPanel2',
      data: function() {
        return Players.find();
      }
    });
  }
});

Router.route('/board/:_id', {
  name: 'board.page',
  loadingTemplate: 'loading',
  layoutTemplate: 'boardLayout',

  waitOn: function() {
    return [
      Meteor.subscribe('games'),
      Meteor.subscribe('players', this.params._id),
      Meteor.subscribe('chat', this.params._id),
      Meteor.subscribe('cards', this.params._id)
    ];
  },

  action: function() {
    this.render('board', {
      data: function() {
        var game = Games.findOne(this.params._id);
        if (game === undefined) {
          Router.go('gamelist.page');
        } else {
          return {game: game, players: Players.find().fetch()};
        }
      }
    });
    this.render('gameState', {
      to: 'gameState',
      data: function() {
        return Games.findOne(this.params._id);
      }
    });
    this.render('chat', {
      to: 'chat',
      data: function() {
        return {messages: Chat.find(), gameId: this.params._id};
      }
    });
    this.render('cards', {
      to: 'cards',
      data: function() {
        var c = Cards.findOne();
        return {game: Games.findOne(this.params._id), cards: c ? c.cards : []};
      }
    });
  }
});
