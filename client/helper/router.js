Router.map(function() {
	this.route('gameList', {
		path: "/",
		yieldTemplates: {
			"gameItemPostForm": {to: "rightPanel"}
		}
	});

	this.route('about');

	this.route('gamePage', {
	  // get parameter via this.params
	  path: '/games/:_id',
	  data: function() {
	  	Session.set('currentGameId', this.params._id);
	  	var game = Games.findOne(this.params._id);
	  	if (game === undefined) {
			Router.go('/');
	  	} else {
		  	return game;
	  	}
	  },
	  yieldTemplates: {
		"gamePageActions": {to: "rightPanel"}
	  }
	});
});

Router.configure({
  layoutTemplate: 'applicationLayout'
});