Meteor.subscribe('onlineUsers');

Meteor.startup(function() {
  analytics.load("fqB9zzTwPC");

  Tracker.autorun(function(c) {
    try {
      UserStatus.startMonitor({threshold: 10000, interval: 1000, idleOnBlur: false});
    } catch (e) { }
  });

  Tracker.autorun(function(c) {
    // waiting for user subscription to load
    if (! Router.current() || ! Router.current().ready())
      return;

    var user = Meteor.user();
    if (! user)
      return;

    analytics.identify(user._id, {
      name: user.profile.name ? user.profile.name : '',
      email: getUsername(user)
    });

    c.stop();
  });
});
