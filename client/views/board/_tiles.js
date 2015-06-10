Template._tiles.helpers({
	rotate: function(direction) {
		var rotate = "rotate(" +90*direction+ "deg);";
		return "transform: "+rotate+" -webkit-transform: "+rotate+' -ms-transform: '+rotate;
	}
});
