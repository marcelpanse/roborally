var assert = require('assert');

suite('Games', function() {
  test('in the server', function(done, server) {
    server.eval(function() {
      Games.insert({title: 'hello title'});
      var docs = Games.find().fetch();
      emit('docs', docs);
    });

    server.once('docs', function(docs) {
      assert.equal(docs.length, 1);
      done();
    });
  });
});
