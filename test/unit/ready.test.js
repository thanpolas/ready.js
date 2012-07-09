

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
  ss.ready(hookTwo);

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

  // try to trick the lib with dummy check call
  niam.check('not exist');

  start();

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
  r.addListener(addHook(9, 'Lazy hook executed'));
  r.addListener(addHook(10, 'Very lazy hook executed', true));
  r.addCheckListener('task1', addHook(1, 'Task1 check hook executed'));
  r.addCheckListener('task2', addHook(3, 'Task2 check hook executed'));
  r.addCheckListener('task2', addHook(4, 'Task2 check lazy hook executed'));
  r.addCheckListener('task3', addHook(6, 'Task3 check hook executed'));

  ok(!r.isDoneCheck('task1'), 'task1 is not done yet');

  // complete the checks
  r.check('task1');
  ok(r.isDoneCheck('task1'), 'task1 is now done');

  equal(seq, 2, 'After task1 is done');
  seq++;

  r.check('task2');

  equal(seq, 5, 'After task2 is done');
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
  r.addListener(addHook(3, 'Lazy hook executed'));
  r.addListener(addHook(4, 'Very lazy hook executed', true));
  var removeOne = r.addListener(addFalseHook('First removed hook'));
  var removeTwo = r.addListener(addFalseHook('Second removed hook'));
  var removeThree = r.addCheckListener('task1', addFalseHook('Third removed check hook'));
  var removeFour = r.addCheckListener('task1', addFalseHook('Fourth removed check hook'));

  r.check('task2');
  ss.ready('a-ready-watch-rumble').check('task3');
  r.removeListener(removeOne);
  ss.ready('a-ready-watch-rumble').removeListener(removeTwo);
  r.removeCheckListener(removeThree);
  ss.ready('a-ready-watch-rumble').removeCheckListener(removeFour);
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

test('Early listeners and heavy chaining', function(){
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

  var r = ss.ready('a silly name');
  r.addListener(hookOne);

  var checkTwo = 'check Two';

  r.addCheck('check One') // add check
    .addCheckListener(checkTwo, hookTwo); // chain addCheckListener

  r.addCheck(checkTwo); // addCheck
  r[checkTwo](); // chain check execution (check done)
  r.addListener(hookThree); // chain addListener

  r.check('check One');
});

test('reset and Dispose method', function(){
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

  ss.ready.reset();

  var r = ss.ready('a silly name');
  r.addListener(hookOne);

  var checkTwo = 'check Two';

  r.addCheck('check One')
    .addCheckListener(checkTwo, hookTwo); // chain addCheckListener

  r.addCheck(checkTwo); // addCheck
  r[checkTwo](); // chain check execution (check done)
  r.addListener(hookThree); // chain addListener

  // dispose
  ss.ready('a silly name').dispose();

  // try to run the last check...
  r.check('check One');

});


test('arguments and callbacks', function(){

  expect( 28 );

  var pass = 1;

  var mockArgs = [4, 'foo', {a:1, b:{c:2}, d:'go'}];

  function hookCheckOne(arg1, arg2, arg3)
  {
    equal(arg1, mockArgs[0], 'Comparing arg1. Pass:' + pass);
    equal(arg2, mockArgs[1], 'Comparing arg2. Pass:' + pass);
    deepEqual(arg3, mockArgs[2], 'Comparing arg3. Pass:' + pass);
    equal(arguments.length, 3, 'checkOne hook must have 3 arguments. Pass:' + pass);
  }

  function hookOne(ready)
  {
    var newReady = ss.ready('go');

    ok(ready instanceof ss.ready.C, 'ready argument is instance of ready class. Pass:' + pass);
    deepEqual(ready, newReady, 'Deep comparing ready instances. Pass:' + pass);

    deepEqual(ready.getArgs('checkOne'), mockArgs, 'deep comparing checkOne arguments. Pass:' + pass);

    equal(ready.getArgs('checkOne').length, 3, 'checkOne args must be 3. Pass:' + pass);

    var checkTwoArgs = ready.getArgs('checkTwo');
    strictEqual(checkTwoArgs[1], null, 'Second arg of checkTwo is null. Pass:' + pass);
    equal(checkTwoArgs.length, 2, 'checkTwo has 2 total args. Pass:' + pass);

    var checkThreeArgs = ready.getArgs('checkThree');
    equal(checkThreeArgs.length, 4, 'checkThree has 4 total args. Pass:' + pass);
    equal(checkThreeArgs[3], 100, 'checkThree last arg is 100. Pass:' + pass);

    var checkFourArgs = ready.getArgs('checkFour');
    equal(checkFourArgs.length, 0, 'Check four has no arguments. Pass:' + pass);
    equal(Object.prototype.toString.call(checkFourArgs), '[object Array]', 'checkFourArgs must be of type array. Pass:' + pass);
  }

  var r = ss.ready('go')
    .addCheck('checkOne')
    .addCheck('checkTwo')
    .addCheck('checkThree')
    .addCheck('checkFour');

  r.addCheckListener('checkOne', hookCheckOne);
  r.addListener(hookOne);

  r.check.apply(r, Array.prototype.concat('checkOne', mockArgs));

  r.check('checkTwo', false, null);

  r.checkThree('foo', 'bar', 'baz', 100);

  r.checkFour();

  // call a lazy hook
  pass++;
  r.addListener(hookOne);

  // and a lazy check hook
  r.addCheckListener('checkOne', hookCheckOne);

});

test('Check callback binding', function(){
  expect( 12 );

  // create a pseudo class
  var AwesomeClass = function(opt_val) {
    this.val = opt_val || 1;
  };
  AwesomeClass.prototype.add = function(val) {
    this.val += val;
  };
  AwesomeClass.prototype.get = function() {
    return this.val;
  };

  var ac = new AwesomeClass(5);
  ac.add(4);

  var acTwo = new AwesomeClass(3);
  acTwo.add(3);


  function hookCheckOne()
  {
    ok(this instanceof AwesomeClass, 'this object is an instance of AwesomeClass');
    equal(this.get(), 9, '.get() method of this should return 9');
    this.add(3);
  }

  function hookTwo()
  {
    ok(this instanceof AwesomeClass, 'this object is an instance of AwesomeClass -two');
    equal(this.get(), 6, '.get() method of this should return 6');
  }

  function hookThree()
  {
    ok(this instanceof AwesomeClass, 'this object is an instance of AwesomeClass -three');
    equal(this.get(), 12, '.get() method of this should return 12');
  }

  var r = ss.ready('bind')
    .addCheck('one')
    .addCheck('two');

  r.addCheckListener('one', hookCheckOne, ac);
  r.addListener(hookTwo, acTwo);
  r.addListener(hookThree, ac);

  r.check('one');
  r.two();

  // call everything lazily
  ac.add(-3);
  r.addCheckListener('one', hookCheckOne, ac);
  r.addListener(hookTwo, acTwo);
  r.addListener(hookThree, ac);

});
