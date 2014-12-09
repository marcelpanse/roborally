Template.splash.events({
  'click .login': function(event) {
    Meteor.setTimeout(function() {
      $("#login-dropdown-list").addClass("open");
    });
    return false;
  }
});
