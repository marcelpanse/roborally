Template.home.rendered = function () {
  $('body').attr('id', 'page-top').attr('class', 'index');

  // jQuery for page scrolling feature - requires jQuery Easing plugin
  $(function () {
    $('.page-scroll a').bind('click', function (event) {
      var $anchor = $(this);
      $('html, body').stop().animate({
        scrollTop: $($anchor.attr('href')).offset().top
      }, 1500, 'easeInOutExpo');
      event.preventDefault();
    });
  });

  // Highlight the top nav as scrolling occurs
  $('body').scrollspy({
    target: '.navbar-fixed-top'
  });

  // Closes the Responsive Menu on Menu Item Click
  $('.navbar-collapse ul li a').click(function () {
    $('.navbar-toggle:visible').click();
  });

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

  var cbpAnimatedHeader = (function () {
    var docElem = document.documentElement,
      header = document.querySelector('.navbar-fixed-top'),
      didScroll = false,
      changeHeaderOn = 300;

    function init() {
      window.addEventListener('scroll', function (event) {
        if (!didScroll) {
          didScroll = true;
          setTimeout(scrollPage, 250);
        }
      }, false);
    }

    function scrollPage() {
      var sy = scrollY();
      if (sy >= changeHeaderOn) {
        classie.add(header, 'navbar-shrink');
      }
      else {
        classie.remove(header, 'navbar-shrink');
      }
      didScroll = false;
    }

    function scrollY() {
      return window.pageYOffset || docElem.scrollTop;
    }

    init();

  })();
};

function initFB() {
  FB.init({
    appId: '826601937360527', // App ID from the App Dashboard
    status: false, // check the login status upon init?
    xfbml: true  // parse XFBML tags on this page?
  });
}