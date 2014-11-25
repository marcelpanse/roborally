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
    return [Meteor.subscribe('games'), Meteor.subscribe('chat')];
  },

  action: function() {
    this.render('gamePage', {
      data: function() {
        var game = Games.findOne(this.params._id);
        if (game === undefined) {
          Router.go('gamelist.page');
        } else if (game.started) {
          console.log('game started, routing to board');
          Router.go('board.page', {_id: this.params._id});
        } else {
          return game;
        }
      }
    });
    this.render('gamePageActions', {
      to: 'rightPanel',
      data: function() {
        return Games.findOne(this.params._id);
      }
    });
  }
});

Router.route('/board/:_id', {
  name: 'board.page',
  loadingTemplate: 'loading',
  layoutTemplate: 'boardLayout',

  waitOn: function() {
    return [Meteor.subscribe('games'), Meteor.subscribe('chat')];
  },

  action: function() {
    this.render('board', {
      data: function() {
        var game = Games.findOne(this.params._id);
        if (game === undefined) {
          Router.go('gamelist.page');
        } else {
          return game;
        }
      }
    });
    this.render('gameChat', {
      to: 'chat',
      data: function() {
        return Games.findOne(this.params._id);
      }
    });
    this.render('cards', {
      to: 'cards',
      data: function() {
        return Games.findOne(this.params._id);
      }
    });
  }
});
