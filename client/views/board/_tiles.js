Template._tiles.helpers({
	visited_checkpoint: function(number) {
		var player = Players.findOne({userId: Meteor.userId()});
		if (player.visited_checkpoints >= number) {
			return 'visited';
		} else {
			return '';
		}
	},
	leq: function(current, limit){
		return (current <= limit);
	},
	rotate: function(direction) {
		var rotate = "rotate(" +90*direction+ "deg);";
		return "transform: "+rotate+" -webkit-transform: "+rotate+' -ms-transform: '+rotate;
	}
});
