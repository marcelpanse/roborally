Meteor.subscribe('onlineUsers');

Meteor.setTimeout(function() {
  UserStatus.startMonitor({threshold: 10000, interval: 1000, idleOnBlur: false});
}, 5 * 1000);

Meteor.startup(function() {
  analytics.load("fqB9zzTwPC");

  Deps.autorun(function(c) {
    // waiting for user subscription to load
    if (! Router.current() || ! Router.current().ready())
      return;

    var user = Meteor.user();
    if (! user)
      return;

    analytics.identify(user._id, {
      name: user.profile ? user.profile.name : '',
      email: user.profile ? '' : user.emails[0].address
    });

    c.stop();
  });
});
