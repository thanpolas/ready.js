/**
 * qunit2node
 *
 * An adapter for converting QUnit tests to nodeUnit
 *
 * PREPEND this file AT THE TOP
 *
 * https://github.com/thanpolas/qunit2node
 *
 * Copyright (c) 2012 Thanasis Polychronakis
 * Licensed under the MIT license.
 */

/** @const {boolean} define we are on node.js env */
var NODE = true;
/** @const {boolean} define debug mode */
var DEBUG = false;

/**
 * The adaptor lives in this namespace
 * @type {Object}
 */
var adaptor = {};

/**
 * A silly debug log function
 * @param  {string} what
 * @return {void}
 */
function __debug(what)
{
  if (!DEBUG) return;

  console.log(what);
}



/**
 * QUnit module mock
 *
 * @param  {string} name The module name.
 * @param  {Object=} lifeCycle lifecycle object containing setup and teardown.
 * @return {void}
 */
var module = function(name, lifeCycle) {
  var moduleObj = {
    moduleName: name,
    lifeCycle: lifeCycle
  };

  __debug('New Module:' + name);

  var module = new adaptor.Module(moduleObj);
  // declare the current module
  adaptor.currentModule = module;
};


/**
 * QUnit test mock
 *
 * @param  {string} name .
 * @param  {function()} fn .
 * @return {void} .
 */
var test = function(name, fn) {
  var testObj = {
    module: adaptor.currentModule,
    fn: fn,
    testName: name
  };

  var moduleName = (adaptor.currentModule && adaptor.currentModule.moduleName ? adaptor.currentModule.moduleName : null);
  __debug('New Test:"' + name + '"');
  __debug('New Test\'s Module:"' + moduleName + '"');

  var test = new adaptor.Test(testObj);

  if (adaptor.hasTest) {
    __debug('Test got queued');
    // queue it up
    adaptor.testQueue.push(test);
    return;
  }

  // run it
  test.start();
};

//
// Register and convert all QUnit assertions
//
var ok = function() {adaptor.currentTest.pushAssert('ok', arguments);};
var expect = function() {adaptor.currentTest.pushAssert('expect', arguments);};
var equal = function() {adaptor.currentTest.pushAssert('equal', arguments);};
var notEqual = function() {adaptor.currentTest.pushAssert('notEqual', arguments);};
var deepEqual = function() {adaptor.currentTest.pushAssert('deepEqual', arguments);};
var notDeepEqual = function() {adaptor.currentTest.pushAssert('notDeepEqual', arguments);};
var strictEqual = function() {adaptor.currentTest.pushAssert('strictEqual', arguments);};
var notStrictEqual = function() {adaptor.currentTest.pushAssert('notStrictEqual', arguments);};
var raises = function() {adaptor.currentTest.pushAssert('throws', arguments);};
// Async testing funcs
var stop = function() {
  __debug('stop() was invoked for test:' + adaptor.currentTest.name);
  adaptor.currentTest.hasStop = true;
};
var start = function() {
  // check if we saw a stop() first
  if (!adaptor.currentTest.hasStop) {
    throw new Error('QUnit\'s start() was executed but no stop() was detected');
  }

  __debug('start() was invoked for test:' + adaptor.currentTest.name);

  var curTest = adaptor.currentTest.nodeunit;

  // pass control to the next test
  adaptor.nextTest();

  // and with that, the test concludes
  curTest.done();

};

// -----------------------------------------------
//
// End of QUnit mocking
//

// Declare adaptor required vars
//
//
/** @type {adaptor.Module?} The current module instance */
adaptor.currentModule = null;
/** @type {adaptor.Test?} The current test instance */
adaptor.currentTest = null;
/** @type {boolean} If we are on a test state */
adaptor.hasTest = false;
/** @type {Array} Tests queue up here */
adaptor.testQueue = [];

/**
 * When a test finishes this function is executed.
 *
 * We check if there is another test in the queue and start it
 * or if we reached the end, clean up
 *
 * @return {void}
 */
adaptor.nextTest = function()
{
  __debug('nextTest executes...');
  if (0 < adaptor.testQueue.length) {
    __debug('Have tests in the queue, starting next...');
    // mode tests down the pipe
    adaptor.testQueue.shift().start();
  } else {
    // finished
    __debug('Adaptor :: All tests finished');
  }
};

/**
 * Bind a scope on a func
 * @param  {function()} fn      The function to bind scope on
 * @param  {Object}   selfObj The object
 * @return {function()}
 */
adaptor.bind = function(fn, selfObj)
{
  if (arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      // Prepend the bound arguments to the current arguments.
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs);
    };

  } else {
    return function() {
      return fn.apply(selfObj, arguments);
    };
  }
};

/**
 * The test constructor
 *
 * @param {Object} testObj (fn, module, testName)
 * @constructor
 */
adaptor.Test = function(testObj)
{
  /** @type {Object} The test object (fn, module, testName) */
  this.testObj = testObj;
  this.name = testObj.testName;
  /** @type {Array} assertions queue up here */
  this.assertQueue = [];
  /** @type {boolean} If a stop() has been executed - async testing */
  this.hasStop = false;
  /** @type {Object} the nodeunit test object */
  this.nodeunit = null;
  /** @type {boolean} switch that indicates if we are running */
  this.unitRuns = false;

  __debug('Test constructor:' + this.name);

  // check if we have a module declaration
  if (null === testObj.module) {
    // no module (group) defined, export directly
    exports[this.name] = adaptor.bind(this.runAsserts, this);
  } else {
    // This test belongs to a module, assign it
    testObj.module.pushTest(this);
  }

};

/**
 * Register all QUnit assertions via this method
 *
 * Depending on unitRun state We'll run them as they come
 * or queue them up
 *
 * @param  {string} type The type of the assertion (function)
 * @param  {Array} args Arguments used in the assertion
 * @return {void}
 */
adaptor.Test.prototype.pushAssert = function(type, args)
{
  __debug('pushAssert called for:' + type + ' unitRuns:' + this.unitRuns);

  if (this.unitRuns) {
    this.nodeunit[ type ].apply(this, args);
  } else {
    this.assertQueue.push({
      type: type,
      args: args
    });
  }
};

/**
 * Declare this test is first in the queue to run...
 *
 * @return {void}
 */
adaptor.Test.prototype.start = function()
{
  __debug('Starting test:' + this.name);
  // declare we have a test in progress
  adaptor.hasTest = true;

   // declare we have the lead
  adaptor.currentTest = this;
};

/**
 * The closure we'll run the QUnit tests in.
 *
 * This method is directly exported and executed by nodeunit
 *
 * @param {Object} test nodeunit's object
 * @return {void|function()} export the test or return the test
 *        to be exported.
 */
adaptor.Test.prototype.runAsserts = function(test)
{

  __debug('nodeunit runs test:' + this.name);

  this.nodeunit = test;
  this.unitRuns = true;

  // run the test to populate assertions
  this.testObj.fn();

  __debug('Assertions ended. hasStop:' + this.hasStop);

  // if no stop was invoked, run done
  if (!this.hasStop) {
    // pass control to the next test
    adaptor.nextTest();

    test.done();
  }


};


/**
 * Initialize a new module object
 *
 * @param  {Object.<string, Object>} moduleObj containing two keys:
 *          moduleName    The module name.
 *          lifeCycle Lifecycle object containing setup and/or teardown functions.
 * @constructor
 */
adaptor.Module = function(moduleObj)
{
  /** @type {Object} The object to export when this module is ready for to be exported to nodeunit */
  this.moduleObject = {};
  /** @type {string} the module name */
  this.moduleName = moduleObj.moduleName;
  /** @type {Array} Contains all tests of this module */
  this.tests = [];

  var lifeCycle = moduleObj.lifeCycle || false;

  // no lifeCycle no more execution...
  if (lifeCycle) {
    if (lifeCycle.setup) {
      this.moduleObject.setUp = function(cb) {
        lifeCycle.setup();
        cb();
      };
    }
    if (lifeCycle.teardown) {
      this.moduleObject.tearDown = function(cb) {
        lifeCycle.teardown();
        cb();
      };
    }
  }

  // export the module
  this.doExport();
};

/**
 * Push all tests this module contains down the test module's queue
 *
 * @param  {adaptor.Test} testInst The test instance
 * @return {void}
 */
adaptor.Module.prototype.pushTest = function(testInst)
{
  this.moduleObject[testInst.name] = adaptor.bind(testInst.runAsserts, testInst);
};

/**
 * Exports the module for execution by QUnit
 *
 * @return {boolean} true
 */
adaptor.Module.prototype.doExport = function()
{
  exports[this.moduleName] = this.moduleObject;
};



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
  r.addCheck('aCheck')
    .addCheck(oddName)
    .addListener(readyOne)
    .addCheckListener('aCheck', checkOne)
    // execution on an instance
    .aCheck();
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
    .addCheckListener(checkTwo, hookTwo) // chain addCheckListener
    .addCheck(checkTwo);
  ss.ready('a silly name')[checkTwo]() // chain check execution (check done)
    .addListener(hookThree) // chain addListener
    .check('check One');
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
    .addCheckListener(checkTwo, hookTwo) // chain addCheckListener
    .addCheck(checkTwo); // addCheck
  ss.ready('a silly name')[checkTwo]() // chain check execution (check done)
    .addListener(hookThree); // chain addListener

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
