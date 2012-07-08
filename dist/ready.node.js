/**
 * This is an adaptor for node.js compatibility. Will get concatenated on top
 * of the library
 */

var goog = {
  provide: function() {},
  require: function() {}
};

/**
 * Declare the ss namespace
 * @type {Object}
 */
var ss = {};

/**
 * @type {boolean}
 */
COMPILED = false;

/**
 * Copyright 2012 Thanasis Polychronakis.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview ready.js 03/Mar/2010
 * Watches over multiple async operations and triggers
 * listeners when all or some are complete.
 */
goog.provide('ss.ready');
goog.provide('ss.ready.C');

/**
 * @define {boolean} we perform some hacks to reduce total size.
 */
ss.STANDALONE = true;

/**
 * The ready function will instanciate a new ready
 * watch or return an existing one if already instanciated.
 * If we want to force instanciation then set the second parameter to true
 *
 * Alternate use, attach to the 'main' ready event by giving a function as
 * the first parameter.
 *
 * @param {string|function()} nameId Unique identifier or function that will attach
 *      to our framework's main ready event...
 * @param {boolean=} opt_forceInit If we need to force Init.
 * @return {ss.ready.C|string} Instance of ss.ready.C or uid of listener
 *              in case nameId is a function.
 */
 ss.ready = function(nameId, opt_forceInit)
 {
  /** @type {ss.ready.C} */
  var c;
  if (ss.ready.isFunction(nameId)) {
    // for calls with a listener, assign the listener
    // to our main ready watch
    c = ss.ready.getInstance(ss.ready.MAIN);
    return c.addListener(/** @type {function()} */ (nameId), opt_forceInit);
  }

  // check for no params and return main instance
  if (0 === arguments.length) {
    return ss.ready.getInstance(ss.ready.MAIN);
  }

  c = ss.ready.getInstance(/** @type {string} */ (nameId));
  if (opt_forceInit) {
      // we want to force initialize --> overwrite
      c = new ss.ready.C( /** @type {string} */ (nameId));
      ss.ready.db.allReady[nameId] = c;
    }
  return c;
}; // ss.ready

/** @const {string} The main ready watch */
ss.ready.MAIN = 'main';

/**
 * Static Data Container
 * @type {Object}
 */
 ss.ready.db = {
  /**
   * Contains all instances
   * @type {Object.<ss.ready.C>}
   */
   allReady: {},
   /**
    * use for generating unique ids
    * @type {number}
    */
   uid: 1
 };

  if (ss.STANDALONE) {
    /**
     * Shorter version of isFunction if we are in standalone
     * mode so we can reduce size
     * @param {*} obj
     * @return {boolean}
     */
    ss.ready.isFunction = function(obj)
    {
      return '[object Function]' === Object.prototype.toString.call(obj);
    };

    /**
     * Shorter version of goog.bind()
     *
     * @param {Function} fn A function to partially apply.
     * @param {Object|undefined} selfObj Specifies the object which |this| should
     *     point to when the function is run.
     * @return {!Function} A partially-applied form of the function bind() was
     *     invoked as a method of.  goog.bind = function(fn, selfObj).
     */
    ss.ready.bind = function(fn, selfObj)
    {
      return function() {
        return fn.apply(selfObj);
      };
    };
  } else {
    ss.ready.isFunction = goog.isFunction;
    ss.ready.bind = goog.bind;
  }

 /**
  * Get a unique id to use as an identifier for the listeners
  * @return {string}
  */
 ss.ready.uid = function()
 {
  return 'uid' + (++ss.ready.db.uid);
 };


/**
 * Returns the ready instance for the nameId provided
 * or creates a new one if it doesn't exist
 *
 * @param {string} nameId
 * @return {ss.ready.C}
 */
 ss.ready.getInstance = function(nameId)
 {

  if (ss.ready.db.allReady[nameId]) {
    return ss.ready.db.allReady[nameId];
  }

  /** @type {ss.ready.C} */
  var c = new ss.ready.C(nameId);
  ss.ready.db.allReady[nameId] = c;
  return c;
};

/**
 * Resets all ready watches.
 *
 * Hard core delete action!
 */
 ss.ready.reset = function()
 {
  for (var r in ss.ready.db.allReady) {
    ss.ready.db.allReady[r].dispose();
    delete ss.ready.db.allReady[r];
  }
};

/**
 * Each check object has:
 *
 * @typedef {{checkId: string, done: boolean, hasFunc: boolean}}
 */
 ss.ready.checkObject;

/**
 * Each listener function object has:
 * @typedef {{fn: function(), delay: number}} Delay in ms, 0 = none
 */
 ss.ready.listenerObject;

/**
 * Each Check Listener function object has:
 * @typedef {{checkId: string, fn: function(), delay: number}}
 */
 ss.ready.checkListenerObject;

/**
 * The ready watch Class
 * Do not call this directly, use ss.ready() as the main
 * entry point
 *
 * @param {string} nameId The name of our ready watch.
 * @constructor
 */
 ss.ready.C = function(nameId)
 {
    /**
     *The instance's name id
     * @private
     * @type {string}
     */
    this.nameId_ = nameId;
    /**
     * Listeners to execute when the ready watch
     * finishes.
     * @private
     * @type {Object.<string, ss.ready.listenerObject>}
     */
    this.fn_ = {};
    /**
     * A hash of check objects
     * @private
     * @type {Object.<string, ss.ready.checkObject>}
     */
    this.checks_ = {};
    /**
     * Check only listeners
     * @private
     * @type {Object.<string, Object.<ss.ready.checkListenerObject>>}
     */
    this.fn_Check_ = {};
    /**
     * Switch to let us know if the ready watch has finished
     * @private
     * @type {boolean}
     */
    this.done_ = false;
 };

/**
 * Disposes all references to checks, listeners, all
 */
ss.ready.C.prototype.dispose = function()
{
  this.dispose_(this.fn_);
  this.dispose_(this.checks_, true);
  this.dispose_(this.fn_Check_);
};

/**
 * Will perform the actual disposing using a for in loop
 * @private
 * @param {Object} obj the object we want to delete all references for.
 * @param {boolean=} opt_func for the special case of addCheck where a function
 *      is added in the this object, set this to true to check and remove
 *      reference to the created function.
 */
ss.ready.C.prototype.dispose_ = function(obj, opt_func)
{
  for (var k in obj) {
    if (opt_func) {
      if (obj[k].hasFunc) {
        this.delete_(this, obj[k].checkId);
      }
    }
    this.delete_(obj, k);
  }
};

/**
 * Checks if ready watch has finished
 *
 * @return {boolean}
 */
ss.ready.C.prototype.isDone = function ()
{
  return this.done_;
}; // method ss.ready.isDone

/**
 * Checks if a certain name and specific check exists and has finished
 * doing it's stuff...
 *
 * @param {string} checkId The id of the check.
 * @return {boolean}
 */
ss.ready.C.prototype.isDoneCheck = function(checkId)
{
  return this.checks_[checkId] && this.checks_[checkId].done || false;
}; // method ss.ready.isDoneCheck



/**
 * Pushes a listener function down the ready queue...
 *
 * @param {function()} fn callback function.
 * @param {number=} opt_delay optionaly set a delay to execute fn in ms.
 * @return {string?} unique id you can use to remove the listener.
 */
ss.ready.C.prototype.addListener = function(fn, opt_delay)
{
  // if watch is finished then we execute the function right away...
  if (this.isDone()) {
    fn();
    return null;
  }

  // push the function object after we create it
  var fnObj = {
    fn: fn,
    delay: opt_delay || 0
  };

  var uid = ss.ready.uid();
  this.fn_[uid] = fnObj;
  return uid;

}; // method ss.ready.addListener

/**
 * Remove a listener function
 * @param {string} uid
 * @return {!ss.ready.C}
 */
ss.ready.C.prototype.removeListener = function(uid)
{
  this.delete_(this.fn_, uid);
  return this;
};

/**
 * Adds a listener for a specific check instead of the whole
 * ready watch
 *
 * @param {string} checkId The name of the check ID.
 * @param {function()} fn callback function.
 * @param {number=} opt_delay optionaly set a delay to execute fn in ms.
 * @return {string?} unique id you can use to remove the check listener.
 */
 ss.ready.C.prototype.addCheckListener = function(checkId, fn, opt_delay)
 {
  // if check or watch is finished then we execute the function right away...
  if (this.done_ || this.isDoneCheck(checkId)) {
    fn();
    return null;
  }

  // see if we can find this check
  var arCheck = this.checks_[checkId];
  if (!arCheck) {
      // no, doesn't exist, create it
      this.addCheck(checkId);
  } // if we didn't find the check

  // construct the object to store
  var obj = {
    checkId: checkId,
    fn: fn,
    delay: opt_delay || 0
  };
  var uid = ss.ready.uid();

  // check if we had previously stored fn objects for this check
  if (this.fn_Check_[checkId]) {
    this.fn_Check_[checkId][uid] = obj;
  } else {
    this.fn_Check_[checkId] = {};
    this.fn_Check_[checkId][uid] = obj;
  }

  return uid;

};

/**
 * Remove a check listener function
 * @param {string} uid
 * @return {!ss.ready.C}
 */
ss.ready.C.prototype.removeCheckListener = function(uid)
{
  for (var check in this.fn_Check_) {
    if (this.fn_Check_[check]) {
      // found it
      this.delete_(this.fn_Check_[check], uid);
      break;
    }
  }
  return this;
};


/**
 * Adds a check to the watch to wait for
 * before firing the ready listeners
 *
 * @param {string} checkId The check string id we will use as a switch.
 * @return {!ss.ready.C}
 */
 ss.ready.C.prototype.addCheck = function(checkId)
 {
  // check if this checkId is already created
  if ( !this.checks_[checkId]) {
      // yup, not found...
      this.checks_[checkId] = {
        checkId: checkId,
        done: false,
        hasFunc: false
      };
      // check if the namespace is available to create a func that will finish this check
      if ( !this[checkId]) {
        // it's available
        this[checkId] = ss.ready.bind(function() {
          this.check(checkId);
        }, this);
        this.checks_[checkId].hasFunc = true;
      }
    }

    return this;
}; // method ss.ready.addCheck

/**
 * Marks a check watch as done, if it's the last one to check
 * then we execute the ready function
 *
 * @param {string} checkId The check string id we will use as a switch.
 * @return {!ss.ready.C}
 */
 ss.ready.C.prototype.check = function(checkId)
 {
  // find the check string in our map of checks...
  var check = this.checks_[checkId];

  if (!check) {
      // not found in checks, check if we have no checks left
      if (this.isChecksComplete_()) {
          // all is done
          this.done_ = true; // set Ready Watch's switch
          // run all listeners
          this._runAll();
        }
        return this;
      }

  // mark the check as done
  check.done = true;
  // execute check's listeners (if any)
  this.runAllChecks_(checkId);
  // set back the check
  this.checks_[checkId] = check;

  // check if all checks are done
  if (this.isChecksComplete_()) {
    this.done_ = true;
      // run all listeners
      this._runAll();
    } else {
    // not done, nothing to do here, move on
  }

  return this;
}; // method ss.ready.check

/**
 * This private function will check if all
 * the checks in a ready watch have completed
 *
 * @return {boolean} .
 * @private
 */
ss.ready.C.prototype.isChecksComplete_ = function()
{
  for (var ch in this.checks_) {
    if (!this.checks_[ch].done) {
      return false;
    }
  }
  return true;
}; // ss.ready.isChecksComplete_

/**
 * Run all listeners for a ready watch
 *
 * We will also run (first) all checks listeners
 *
 * All listeners will be deleted after run
 *
 * @private
 * @return {void}
 */
ss.ready.C.prototype._runAll = function()
{
  // run all check listeners first
  for (var ch in this.fn_Check_) {
    this.runAllChecks_(ch);
    this.delete_(this.fn_Check_, ch);
  }

  // now go for all main ready watch listeners
  for (var fnid in this.fn_) {
    if (ss.ready.isFunction(this.fn_[fnid].fn)) {
      // exec callback method with state of execution after set delay...
      if (0 === this.fn_[fnid].delay) {
        this.fn_[fnid].fn();
      } else {
        this.runDelayed_(this.fn_[fnid].fn, this.fn_[fnid].delay);
      }
    }
    this.delete_(this.fn_, fnid);
  }

}; // ss.ready._runAll


/**
 * Run all listeners for a specific check
 *
 *
 * All listeners will be deleted after run
 * @private
 * @param {string} checkId The check we want to execute the listeners of.
 */
ss.ready.C.prototype.runAllChecks_ = function(checkId)
{

  var chObj;
  for (var ch in this.fn_Check_[checkId]) {
    chObj = this.fn_Check_[checkId][ch];
    if (ss.ready.isFunction(chObj.fn)) {
      // found a listener for this check, check for delay
      if (0 === chObj.delay) {
        chObj.fn();
      } else {
        this.runDelayed_(chObj.fn, chObj.delay);
      }
    }
    this.delete_(this.fn_Check_[checkId], ch);
  }
  this.delete_(this.fn_Check_, checkId);
};

/**
 * Shortcut method to deleting a key from an object
 * Main reason is to have reduced compiled size
 *
 * meh, this didn't work, compiler inlines all delete calls
 *
 * @private
 * @param {*} obj
 * @param {!string} key they key to delete.
 */
ss.ready.C.prototype.delete_ = function(obj, key)
{
  delete obj[key];
};

/**
 * Run a function after specified delay
 * @private
 * @param {function()} fn .
 * @param {number} delay .
 */
ss.ready.C.prototype.runDelayed_ = function(fn, delay)
{
  setTimeout(fn, delay);
};

// exports
goog.provide('ss.ready.compiled');
goog.require('ss.ready');

// This only makes sense to the compiler and helps us reduce
// compiled size by ommiting the same namespace literal many times
// and avoid using goog.exportSymbol
if (COMPILED) {
  var r = ss.ready;
  r['C'] = ss.ready.C;
  var c = ss.ready.C.prototype;
  c['addCheck'] = c.addCheck;
  c['check'] = c.check;
  c['addCheckListener'] = c.addCheckListener;
  c['removeCheckListener'] = c.removeCheckListener;
  //c['addListener'] = c.addListener;
  c['removeListener'] = c.removeListener;
  c['isDone'] = c.isDone;
  c['isDoneCheck'] = c.isDoneCheck;
  c['dispose'] = c.dispose;

  r['C'].prototype = c;

  window['ss'] = {
      'ready': r
  };
}
// check for node.js
if (!COMPILED && typeof exports === 'object' && exports) {
    module.exports = ss.ready;
}
