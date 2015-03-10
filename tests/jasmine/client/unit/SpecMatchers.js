beforeEach(function () {
  jasmine.addMatchers({
    toBeAt: function () {
      return {
        compare: function (actual, expectedX, expectedY) {
          var player = actual;

          return {
            pass: player.position.x === expectedX && player.position.y === expectedY
          };
        }
      };
    },
    toFace: function () {
      return {
        compare: function (actual, expectedDir) {
          var player = actual;

          return {
            pass: player.direction === expectedDir
          };
        }
      };
    }
  });
});
