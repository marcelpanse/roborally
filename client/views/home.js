Template.home.rendered = function() {
  $('body').attr('id', 'page-top').attr('class', 'index');

  // jQuery for page scrolling feature - requires jQuery Easing plugin
  $(function() {
      $('.page-scroll a').bind('click', function(event) {
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
  $('.navbar-collapse ul li a').click(function() {
      $('.navbar-toggle:visible').click();
  });

  var cbpAnimatedHeader = (function() {
    var docElem = document.documentElement,
      header = document.querySelector( '.navbar-fixed-top' ),
      didScroll = false,
      changeHeaderOn = 300;

    function init() {
      window.addEventListener( 'scroll', function( event ) {
        if( !didScroll ) {
          didScroll = true;
          setTimeout( scrollPage, 250 );
        }
      }, false );
    }

    function scrollPage() {
      var sy = scrollY();
      if ( sy >= changeHeaderOn ) {
        classie.add( header, 'navbar-shrink' );
      }
      else {
        classie.remove( header, 'navbar-shrink' );
      }
      didScroll = false;
    }

    function scrollY() {
      return window.pageYOffset || docElem.scrollTop;
    }

    init();

  })();
};
