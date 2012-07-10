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
    return c.addListener(/** @type {function()} */ (nameId));
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
  } else {
    ss.ready.isFunction = goog.isFunction;
    ss.ready.bind = goog.bind;
  }

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
 * @typedef {{checkId: string,
 *          done: boolean,
 *          hasFunc: boolean,
 *          args: Array
 *          }}
 */
 ss.ready.checkObject;

/**
 * Each listener function object has:
 * @typedef {{
 *          fn: function(ss.ready.C),
 *          selfObj: Object
 *          }}
 */
 ss.ready.listenerObject;

/**
 * Each Check Listener function object has:
 * @typedef {{
 *          checkId: string,
 *          fn: function([...*]),
 *          selfObj: Object
 *          }}
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
     * @type {Array.<ss.ready.listenerObject>}
     */
    this.fn_ = [];
    /**
     * A hash of check objects
     * @private
     * @type {Object.<string, ss.ready.checkObject>}
     */
    this.checks_ = {};
    /**
     * Check only listeners
     * @private
     * @type {Object.<string, Array.<ss.ready.checkListenerObject>>}
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
 * @param {function(ss.ready.C)} fn callback function.
 * @param {Object|undefined} opt_selfObj Specifies the object which |this| should
 *     point to when the function is run.
 * @return {!ss.ready.C} unique id you can use to remove the listener.
 */
ss.ready.C.prototype.addListener = function(fn, opt_selfObj)
{
  var selfObj = opt_selfObj || this;
  // if watch is finished then we execute the function right away...
  if (this.isDone()) {
    fn.call(selfObj, this);
    return this;
  }

  // push the function object after we create it
  var fnObj = {
    fn: fn,
    selfObj: selfObj
  };

  this.fn_.push(fnObj);
  return this;

}; // method ss.ready.addListener

/**
 * Adds a listener for a specific check instead of the whole
 * ready watch
 *
 * @param {string} checkId The name of the check ID.
 * @param {function([...*])} fn callback function.
 * @param {Object|undefined} opt_selfObj Specifies the object which |this| should
 *     point to when the function is run.
 * @return {!ss.ready.C} unique id you can use to remove the check listener.
 */
 ss.ready.C.prototype.addCheckListener = function(checkId, fn, opt_selfObj)
 {
  var selfObj = opt_selfObj || this;
  // if check or watch is finished then we execute the function right away...
  if (this.done_ || this.isDoneCheck(checkId)) {
    fn.apply(selfObj, this.getArgs(checkId));
    return this;
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
    selfObj: selfObj
  };

  this.fn_Check_[checkId].push(obj);
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
  if (this.checks_[checkId]) {
    return;
  }
  // nice, not found...
  this.checks_[checkId] = {
    checkId: checkId,
    done: false,
    hasFunc: false,
    args: null
  };

  // init our func array
  this.fn_Check_[checkId] = [];

  // check if the namespace is available to create a func that will finish this check
  if ( !this[checkId]) {
    // it's available, assign it
    this[checkId] = ss.ready.bind(this.check, this, checkId);
    this.checks_[checkId].hasFunc = true;
  }

  return this;
}; // method ss.ready.addCheck

/**
 * Marks a check watch as done, if it's the last one to check
 * then we execute the ready function
 *
 * @param {string} checkId The check string id we will use as a switch.
 * @param {...*}  var_args arguments that will be applied to the callback
 * @return {!ss.ready.C}
 */
 ss.ready.C.prototype.check = function(checkId, var_args)
 {
  // find the check string in our map of checks...
  var check = this.checks_[checkId];

  if (!check) {
    // not found in checks, just return this object
    return this;
  }

  // if check already done, return
  if (check.done) {
    return this;
  }

  // mark the check as done
  check.done = true;

  // assign the arguments, removing checkId and converting
  // arguments to a native Array object
  check.args = Array.prototype.slice.call(arguments, 1);

  // execute check's listeners (if any)
  this.runAllChecks_(checkId);

  // check if all checks are done
  if (this.isChecksComplete_()) {
    this.done_ = true;
      // run all listeners
      this._runAll();
  }

  return this;
};

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
  var fnObj = this.fn_.shift();
  while(fnObj) {
    if (ss.ready.isFunction(fnObj.fn)) {
      // exec callback method
      fnObj.fn.call(fnObj.selfObj, this);
    }

    fnObj = this.fn_.shift();
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
  if (0 === this.fn_Check_[checkId].length) {
    return;
  }

  var chObj = this.fn_Check_[checkId].shift();
  while (chObj) {
    if (ss.ready.isFunction(chObj.fn)) {
      // found a listener for this check
      chObj.fn.apply(chObj.selfObj, this.getArgs(checkId));
    }
    chObj = this.fn_Check_[checkId].shift();
  }
  this.delete_(this.fn_Check_, checkId);
};

ss.ready.C.prototype.getArgs = function(checkId)
{
  return this.checks_[checkId].args;
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
