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

Router.route('/game', {
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

Router.route('/about', function() {
  this.render('about');
  this.render('aboutSidePanel', {to: 'rightPanel'});
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
          Router.go('/');
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
          Router.go('/');
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
  }
});
