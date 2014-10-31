Meteor.subscribe('onlineUsers');

Meteor.setTimeout(function() {
	UserStatus.startMonitor({threshold: 10000, interval: 1000, idleOnBlur: false});
}, 5 * 1000);
