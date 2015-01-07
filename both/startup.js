Meteor.startup(function () {
  if (Meteor.isClient) {
    if (Meteor.absoluteUrl().indexOf("localhost") == -1) {
      Meteor.absoluteUrl.defaultOptions.rootUrl = "https://www.roborally.com/";
    }
  } else {
    Meteor.absoluteUrl.defaultOptions.rootUrl = "https://www.roborally.com/";
  }
});
