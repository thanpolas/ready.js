module('ss.ready', {
  setup: function(){
    ss.ready.reset();
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
  expect( 4 );

  stop();

  function hookOne()
  {
    ok(true, 'Listener One executed');
  }
  function hookTwo()
  {
    ok(true, 'Listener Two executed');
    start();
  }

  var main = ss.ready('main');

  // add 2 checks
  main.addCheck('task1');
  main.addCheck('task2');

  // add our listeners
  main.addListener(hookOne);
  main.addListener(hookTwo);

  ok(!main.isDone(), 'Ready watch is not done yet');

  // complete the checks
  main.check('task1');
  main.check('task2');

  ok(main.isDone(), 'Ready watch is now done');
});


test('Sequence of execution', function() {
  expect( 12 );
  stop();

  var seq = 1;

  function addHook(testSeq, title, opt_done)
  {
    return function(){
      equal(seq, testSeq, title);
      seq++;
      if (opt_done) {
        start();
      }
    };
  }
  
  var r = ss.ready('a-ready-watch');
  
  // add checks
  r.addCheck('task1');
  r.addCheck('task2');
  r.addCheck('task3');
  
  // add listeners
  r.addListener(addHook(7, 'First main hook executed'));
  r.addListener(addHook(8, 'Second main hook executed'));  
  r.addListener(addHook(9, 'Lazy hook executed'), 300);
  r.addListener(addHook(10, 'Very lazy hook executed', true), 600);  
  r.addCheckListener('task1', addHook(1, 'Task1 check hook executed'));
  r.addCheckListener('task2', addHook(3, 'Task2 check hook executed'));
  r.addCheckListener('task2', addHook(5, 'Task2 check lazy hook executed'), 50);
  r.addCheckListener('task3', addHook(6, 'Task3 check hook executed'));
      
  ok(!r.isDoneCheck('task1'), 'task1 is not done yet');

  // complete the checks
  r.check('task1');
  ok(r.isDoneCheck('task1'), 'task1 is now done'); 
  
  equal(seq, 2, 'After task1 is done');
  seq++;  
  
  r.check('task2');

  equal(seq, 4, 'After task2 is done');
  seq++;  
  
  // execute after 100ms
  setTimeout(function(){
    r.check('task3');    
  }, 100);
});
