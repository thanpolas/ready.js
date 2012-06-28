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
 * The ready function will instanciate a new ready
 * watch or return an existing one if already instanciated.
 * If we want to force instanciation then set the second parameter to true
 *
 * Alternate use, attach to the 'main' ready event by giving a function as
 * the first parameter.
 *
 * @param {string|function()} nameId Unique identifier or function that will attach
 *      to our framework's main ready event...
 * @param {boolean=} opt_forceInit If we need to force Init
 * @return {ss.ready.C}
 */
 ss.ready = function(nameId, opt_forceInit)
 {
  /** @type {ss.ready.C} */
  var c;
  if(goog.isFunction(nameId)) {
    // for calls with a listener, assign the listener
    // to our main ready watch
    c = ss.ready.getInstance(ss.ready.MAIN);
    c.addListener(nameId);
    return c;
  }

  if (!goog.isString(nameId) && !goog.isNumber(nameId)) {
    throw new TypeError('String or Number allowed');
  }

  c = ss.ready.getInstance(nameId);
  if (opt_forceInit) {
      // we want to force initialize --> overwrite
      c = new ss.ready.C(nameId);
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
   allReady: {}
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
    delete ss.ready.db.allReady[r];
  }
};

/**
 * Each check object has:
 *
 * @typedef {{checkId: string, done: boolean}}
 */
 ss.ready.checkObject;

/**
 * Each listener function object has:
 * @typedef {{Function(), number}} Delay in ms, 0 = none
 */
 ss.ready.listenerObject;

/**
 * Each Check Listener function object has:
 * @typedef {{string, function()}}
 */
 ss.ready.checkListenerObject;

/**
 * The ready watch Class
 * Do not call this directly, use ss.ready() as the main
 * entry point
 *
 * @param {string} nameId The name of our ready watch
 * @constructor
 */
 ss.ready.C = function(nameId)
 {
    /**
     *The instance's name id
     * @private
     * @type {string}
     */
    this.nameId = nameId;
    /**
     * Listeners to execute when the ready watch
     * finishes.
     * @private
     * @type {Object.<integer, ss.ready.listenerObject>}
     */
    this.fn = {};
    /**
     * A hash of check objects
     *
     * @type {Object.<string, ss.ready.checkObject>}
     */
    this.checks = {};
    /**
     * Check only listeners
     * @private
     * @type {Object.<integer, Object.<ss.ready.checkListenerObject>>}
     */
    this.fnCheck = {};
    /**
     * Switch to let us know if the ready watch has finished
     * @private
     * @type {boolean}
     */
    this.done = false;
 };

/**
 * Checks if ready watch has finished
 *
 * @return {boolean}
 */
 ss.ready.C.prototype.isDone = function ()
 {
  return this.done;
}; // method ss.ready.isDone

/**
 * Checks if a certain name and specific check exists and has finished
 * doing it's stuff...
 *
 * @param {string} checkId The id of the check
 * @return {boolean}
 */
 ss.ready.C.prototype.isDoneCheck = function (checkId)
 {
  return this.checks[checkId].done || false;
}; // method ss.ready.isDoneCheck



/**
 * Pushes a listener function down the ready queue...
 *
 * @param {function()} fn callback function
 * @param {number=} opt_delay optionaly set a delay to execute fn in ms
 * @return {number} unique id you can use to remove the listener
 */
 ss.ready.C.prototype.addListener = function(fn, opt_delay)
 {
  // if watch is finished then we execute the function right away...
  if (this.isDone()) {
    fn();
    return NaN;
  }

  // push the function object after we create it
  var fnObj = {
    fn: fn,
    delay: opt_delay || 0
  };

  var uid = goog.getUid(fnObj);
  this.fn[uid] = fnObj;
  return uid;

}; // method ss.ready.addListener

/**
 * Remove a listener function
 * @param {number} uid
 * @return {void}
 */
ss.ready.C.prototype.removeListener = function (uid)
{
  delete this.fn[uid];
};

/**
 * Adds a listener for a specific check instead of the whole
 * ready watch
 *
 * @param {string} checkId The name of the check ID
 * @param {function()} fn callback function
 * @param {number=} opt_delay optionaly set a delay to execute fn in ms
 * @return {number} unique id you can use to remove the check listener
 */
 ss.ready.C.prototype.addCheckListener = function(checkId, fn, opt_delay)
 {
  // if check or watch is finished then we execute the function right away...
  if (this.done || this.isDoneCheck(checkId)) {
    fn();
    return NaN;
  }

  // see if we can find this check
  var arCheck = this.checks[checkId];
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
  var uid = goog.getUid(obj);

  // check if we had previously stored fn objects for this check
  if(this.fnCheck[checkId]) {
    this.fnCheck[checkId][uid] = obj;
  } else {
    this.fnCheck[checkId] = {};
    this.fnCheck[checkId][uid] = obj;
  }

  return uid;

};

/**
 * Remove a check listener function
 * @param {number} uid
 */
ss.ready.C.prototype.removeCheckListener = function (uid)
{
  for (var check in this.fnCheck) {
    if (this.fnCheck[check]) {
      // found it
      delete this.fnCheck[check][uid];
      break;
    }
  }
};


/**
 * Adds a check to the watch to wait for
 * before firing the ready listeners
 *
 * @param {string} checkId The check string id we will use as a switch
 * @return {void}
 */
 ss.ready.C.prototype.addCheck = function(checkId)
 {
  // check if this checkId is already created
  var check = this.checks[checkId];
  if (!check) {
      // yup, not found...
      this.checks[checkId] = {
        checkId: checkId,
        done: false
      };
    }
}; // method ss.ready.addCheck


/**
 * Marks a check watch as done, if it's the last one to check
 * then we execute the ready function
 *
 * @param {string} checkId The check string id we will use as a switch
 * @param {boolean=} opt_state If check method failed, set this to false
 * @return {void}
 */
 ss.ready.C.prototype.check = function(checkId, opt_state)
 {
  // find the check string in our map of checks...
  var check = this.checks[checkId];

  if (!check) {
      // not found in checks, check if we have no checks left
      if (this._isChecksComplete()) {
          // all is done
          this.done = true; // set Ready Watch's switch
          // run all listeners
          this._runAll();
        }
        return;
      }

  // mark the check as done
  check.done = true;
  // execute check's listeners (if any)
  this._runAllChecks(checkId);
  // set back the check
  this.checks[checkId] = check;

  // check if all checks are done
  if (this._isChecksComplete()) {
    this.done = true;
      // run all listeners
      this._runAll();
    } else {
    // not done, nothing to do here, move on
  }
}; // method ss.ready.check

/**
 * This private function will check if all
 * the checks in a ready watch have completed
 *
 * @return {boolean}
 * @private
 */
ss.ready.C.prototype._isChecksComplete = function ()
{
  for (var ch in this.checks) {
    if (!this.checks[ch].done) {
      return false;
    }
  }
  return true;
}; // ss.ready._isChecksComplete

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
ss.ready.C.prototype._runAll = function ()
{
  // run all check listeners first
  for (var ch in this.fnCheck) {
    this._runAllChecks(ch);
    delete this.fnCheck[ch];
  }

  // now go for all main ready watch listeners
  for (var fnid in this.fn) {
    if (goog.isFunction(this.fn[fnid].fn)) {
      // exec callback method with state of execution after set delay...
      if (0 === this.fn[fnid].delay) {
        this.fn[fnid].fn();
      } else {
        setTimeout(this.fn[fnid].fn, this.fn[fnid].delay);
      }
    }
    delete this.fn[fnid];
  }

}; // ss.ready._runAll


/**
 * Run all listeners for a specific check
 *
 *
 * All listeners will be deleted after run
 * @private
 * @param {string} checkId The check we want to execute the listeners of
 * @return {void}
 */
ss.ready.C.prototype._runAllChecks = function(checkId)
{

  var chObj;
  for (var ch in this.fnCheck[checkId]) {
    chObj = this.fnCheck[checkId][ch];
    if(goog.isFunction(chObj.fn)) {
      // found a listener for this check, check for delay
      if (0 === chObj.delay) {
        chObj.fn();
      } else {
        setTimeout(chObj.fn, chObj.delay);
      }
    }
    delete this.fnCheck[checkId][ch];
  }
  delete this.fnCheck[checkId];
};
