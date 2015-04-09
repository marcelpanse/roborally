Template.applicationLayout.rendered = function () {
  // Closes the Responsive Menu on Menu Item Click
  $('.navbar-collapse ul li a').click(function () {
    $('.navbar-toggle:visible').click();
  });

  window.doorbellOptions = {
    appKey: '1GPXj8RPAXt3iGibqNSf1978NLFUZBXo0dankpi1X7pc3ApynhRdEGEN8bZohI4f'
  };
  (function (d, t) {
    var g = d.createElement(t);
    g.id = 'doorbellScript';
    g.type = 'text/javascript';
    g.async = true;
    g.src = 'https://doorbell.io/button/970?t=' + (new Date().getTime());
    (d.getElementsByTagName('head')[0] || d.getElementsByTagName('body')[0]).appendChild(g);
  }(document, 'script'));

  if (typeof FB === "undefined") {
    window.fbAsyncInit = initFB;
  } else {
    FB.XFBML.parse();
    //Hack to make the FB like button always show..
    Meteor.setTimeout(function() {
      $(".fb-like").find("span").css("width", "120px").css("height", "20px");
      $(".fb-like").find("iframe").css("width", "120px").css("height", "20px");
    }, 2000);
  }
};

function initFB() {
  FB.init({
    appId: '826601937360527', // App ID from the App Dashboard
    status: false, // check the login status upon init?
    xfbml: true  // parse XFBML tags on this page?
  });
}