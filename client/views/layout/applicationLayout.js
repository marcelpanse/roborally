Template.applicationLayout.rendered = function() {
  // Closes the Responsive Menu on Menu Item Click
  $('.navbar-collapse ul li a').click(function() {
      $('.navbar-toggle:visible').click();
  });

  window.doorbellOptions = {
      appKey: '1GPXj8RPAXt3iGibqNSf1978NLFUZBXo0dankpi1X7pc3ApynhRdEGEN8bZohI4f'
  };
  (function(d, t) {
      var g = d.createElement(t);g.id = 'doorbellScript';g.type = 'text/javascript';g.async = true;g.src = 'https://doorbell.io/button/970?t='+(new Date().getTime());(d.getElementsByTagName('head')[0]||d.getElementsByTagName('body')[0]).appendChild(g);
  }(document, 'script'));
};
