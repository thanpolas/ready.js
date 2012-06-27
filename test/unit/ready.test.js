module('ss.ready', {
  setup: function(){
  },
  teardown: function() {
  }
});


// Parameters fixture
var ParamsFixture = function()
{
  return {};
};

/**
 * Get the params fixture array
 *
 * @param {boolean=} opt_JSON set to true to get a JSON string
 * @return {Array|string}
 */
var getParams = function(opt_JSON)
{
  if (opt_JSON) {
    return JSON.stringify(new ParamsFixture());
  } else {
    return new ParamsFixture();
  }
};


test('Core functionality', function() {
  expect( 1 );

  stop();
  
  ok(true, 'That was easy!');
  
  start();


});
