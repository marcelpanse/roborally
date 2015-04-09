Meteor.subscribe('onlineUsers');

Meteor.startup(function() {
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

    mixpanel.people.set({
      name: getUsername(user),
      email: user.services && user.services.facebook ? user.services.facebook.email : user.emails[0].address
    });
    mixpanel.identify(user._id);

    c.stop();
  });
});