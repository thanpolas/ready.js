

var NODE = NODE || false;
// check for node.js
if ((NODE)) {
  var ss = {
    ready: require('../../dist/ready.node.js')
  };
}


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
  expect( 9 );

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

  function hookThree()
  {
    ok(true, 'Listener Three executed');
  }
  function hookFour()
  {
    ok(true, 'Listener Four executed');
  }

  function hookFive()
  {
    ok(true, 'Listener Five executed');
  }

  ss.ready(hookOne);
  ss.ready(hookTwo, 50);

  var main = ss.ready('main');

  // add 2 checks
  main.addCheck('task1');
  main.addCheck('task2');

  // add our listeners - test no params call
  ss.ready().addListener(hookThree);

  ok(!main.isDone(), 'Ready watch is not done yet');

  // complete the checks
  ok(!main.isDoneCheck('task1'), 'task 1 is not done yet');
  main.check('task1');
  ok(main.isDoneCheck('task1'), 'task 1 is now done');

  // get main watch in another variable
  var niam = ss.ready('main');
  niam.addListener(hookFour);

  niam.check('task2');

  ok(niam.isDone(), 'Ready watch is now done');

  // a done ready watch should execute synchronously the listener
  niam.addListener(hookFive);

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
  r.addListener(addHook(9, 'Lazy hook executed'), 100);
  r.addListener(addHook(10, 'Very lazy hook executed', true), 150);
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
  }, 80);
});


test('Canceling listeners', function() {
  expect( 4 );

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

  function addFalseHook(title)
  {
    return function(){
      ok(false, title);
      start();
    };

  }

  var r = ss.ready('a-ready-watch-rumble');

  // add checks
  r.addCheck('task1');
  r.addCheck('task2');
  r.addCheck('task3');

  // add listeners
  r.addListener(addHook(1, 'First main hook executed'));
  r.addListener(addHook(2, 'Second main hook executed'));
  r.addListener(addHook(3, 'Lazy hook executed'), 30);
  r.addListener(addHook(4, 'Very lazy hook executed', true), 60);
  var removeOne = r.addListener(addFalseHook('First removed hook'));
  var removeTwo = r.addListener(addFalseHook('Second removed hook'), 10);
  var removeThree = r.addCheckListener('task1', addFalseHook('Third removed check hook'));
  var removeFour = r.addCheckListener('task1', addFalseHook('Fourth removed check hook'), 20);

  r.check('task2');
  r.check('task3');
  r.removeListener(removeOne);
  r.removeListener(removeTwo);
  r.removeCheckListener(removeThree);
  r.removeCheckListener(removeFour);
  r.check('task1');
});



test('Multiple Ready Watches', function() {

  expect( 28 );

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

  // 14 names
  var readyNames = ['apple', 'oragne', 'banana', 'alpha', 'bravo', 'charlie', 'delta',
      'echo', 'foxtrot', 'golf', 'hotel', 'India', 'JulieT', 'Kilo'];

  // create ready watches and add checks
  var readyWatches = [];
  var r = null;
  for(var i = 0, l = readyNames.length; i < l ; i++) {
    r = ss.ready(readyNames[i]);
    r.addCheck('task1');
    r.addCheck('task2');
    r.addCheck('task3');
  }

  // add listeners to ready watches
  for(i = 0 ; i < l ; i++) {
    r = ss.ready(readyNames[i]);
    r.addListener(addHook(i + i + 1, readyNames[i] + ' hook executed No1'));
    r.addListener(addHook(i + i + 2, readyNames[i] + ' hook executed No2'));
  }

  // Complete checks
  for(i = 0 ; i < l ; i++) {
    r = ss.ready(readyNames[i]);
    r.check('task1');
    r.check('task2');
    r.check('task3');
  }


});

test('Lazy hooks and force init', function(){
  expect( 3 );
  function readyOne() {
    ok(true, 'Lazy ready watch should be executed');
  }

  function checkOne() {
    ok(true, 'Lazy check should be executed');
  }

  var r = ss.ready('a-watch');
  r.addCheck('a-check');

  // finish the ready watch
  r.check('a-check');

  // now add listeners after the watch is done
  r.addListener(readyOne);
  r.addCheckListener('a-check', checkOne);

  // now force init of our ready watch
  var newR = ss.ready('a-watch', true);
  newR.addListener(readyOne);
  // again, force init to overwrite previous addListener call
  var moreR = ss.ready('a-watch', true);
  moreR.addListener(readyOne);
  moreR.addCheck('one');
  moreR.one();
  // our basic assertion here is that we expect 3  asserts
});


test('Checks as function and chaining', function(){
  expect( 2 );
  function readyOne() {
    ok(true, 'Watch should be executed');
  }

  function checkOne() {
    ok(true, 'Check should be executed');
  }

  var r = ss.ready('aWatch');
  var oddName = 'dashes-not-allowed-as-func-names';
  r.addCheck('aCheck').addCheck(oddName);

  r.addListener(readyOne);
  r.addCheckListener('aCheck', checkOne);

  // execution on an instance
  r.aCheck();
  // execution from builder
  ss.ready('aWatch')[oddName]();
});

test('Early listeners, shortcuts and heavy chaining', function(){
  expect( 3 );

  function hookOne()
  {
    ok(true, 'Listener One executed');
  }
  function hookTwo()
  {
    ok(true, 'Check Listener Two executed');
  }
  function hookThree()
  {
    ok(true, 'Listener Three executed');
  }

  var r = ss.ready('a silly name').al(hookOne);

  var checkTwo = 'check Two';

  r.ac('check One') // add check
    .acl(hookTwo); // chain addCheckListener

  r.ac(checkTwo) // addCheck
    [checkTwo]() // chain check execution (check done)
    .al(hookThree); // chain addListener

  r.c('check One');
});

test('Dispose method', function(){
 expect( 1 );

  function hookOne()
  {
    ok(false, 'Listener One should not be executed');
  }
  function hookTwo()
  {
    ok(true, 'Check Listener Two executed');
  }
  function hookThree()
  {
    ok(false, 'Listener Three should not be executed');
  }

  var r = ss.ready('a silly name');
  r.al(hookOne);

  var checkTwo = 'check Two';

  r.ac('check One')
    .acl(hookTwo); // chain addCheckListener

  r.ac(checkTwo) // addCheck
    [checkTwo]() // chain check execution (check done)
    .al(hookThree); // chain addListener

  // dispose
  ss.ready('a silly name').dispose();

  // try to run the last check...
  r.c('check One');

});
