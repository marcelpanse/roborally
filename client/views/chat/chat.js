Template.chat.events({
  'submit form': function(event) {
    event.preventDefault();
    var message = {
      gameId: $(event.target).find('[name=gameId]').val(),
      message: $(event.target).find('[name=message]').val()
    };

    if (message.message.length > 0) {
      Meteor.call('addMessage', message, function(error) {
        if (error)
          return alert(error.reason);

        $(event.target).find('[name=message]').val('');
      });
    }
  }
});

Template.chat.rendered = function() {
  Chat.find().observe({added: function() {
    console.log('added');
    var $chat     = $('.chat'),
        $printer  = $('.messages', $chat),
        printerH  = $printer.innerHeight();
    if ($printer && $printer[0]) {
      $printer.stop().animate( {scrollTop: $printer[0].scrollHeight - printerH  }, 100);
    }
  }});
};
