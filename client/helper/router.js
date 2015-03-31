Router.configure({
  layoutTemplate: 'applicationLayout'
});

Meteor.startup(function() {
  document.title = "RoboRally online!";

  if (Meteor.settings && Meteor.settings.public.mixpanelEnabled) {
    mixpanel.init('2ea215e4a5be057fa7ec3dd2a0e2100a');
  }
});

Router.route('/', {
  name: 'home.page',
  layoutTemplate: 'home',
  action: function() {
    mixpanel.track("Viewed home Page");
    if (Meteor.isCordova) {
      Router.go('gamelist.page');
    } else {
      this.next();
    }
  }
});

Router.route('/online', {
  name: 'gamelist.page',
  loadingTemplate: 'loading',

  waitOn: function() {
    return [Meteor.subscribe('games'),
      Meteor.subscribe('chat', "global")];
  },

  action: function() {
    mixpanel.track("Viewed game list Page");
    this.render('gameList');
    this.render('gameItemPostForm', {to: 'rightPanel'});
    this.render('chat', {
      to: 'rightPanel2',
      data: function() {
        return {messages: Chat.find(), gameId: "global"};
      }
    });
  }
});

Router.route('/select/:_id', {
  name: 'boardselect.page',
  loadingTemplate: 'loading',

  waitOn: function() {
    return [Meteor.subscribe('games'),
      Meteor.subscribe('players', this.params._id)];
  },

  action: function() {
    mixpanel.track("Viewed change board Page");
    this.render('boardselect', {
      data: function() {
        var game = Games.findOne(this.params._id);
        if (game === undefined) {
          Router.go('gamelist.page');
        } else if (game.started) {
          console.log('game started, routing to board');
          Router.go('board.page', {_id: this.params._id});
        } else {
          return {game: game, players: Players.find().fetch()};
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
        var game = Games.findOne(this.params._id);
        return {players: Players.find(), game: game};
      }
    });
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
        var game = Games.findOne(this.params._id);
        return {players: Players.find(), game: game};
      }
    });
    this.render('selectedBoard', {
      to: 'rightPanel3',
      data: function() {
        var game = Games.findOne(this.params._id);
        var board = game.board();
        return { width: board.width*24,
                 height: board.height*24,
                 extra_class: '',
                 game: game,
                 board: board
               };
      }
    });
  }
});

Router.route('/board/:_id', {
  name: 'board.page',
  loadingTemplate: 'loading',

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
    this.render('cards', {
      to: 'rightPanel',
      data: function() {
        var c = Cards.findOne();
        return {
          game: Games.findOne(this.params._id),
          handCards: c.handCards,
          chosenCards: c.chosenCards,
          players: Players.find()
        };
      }
    });
    this.render('chat', {
      to: 'rightPanel2',
      data: function() {
        return {messages: Chat.find(), gameId: this.params._id};
      }
    });
  }
});
