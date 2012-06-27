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

goog.require('goog.structs.Map');

/**
 * The ready function will instanciate a new ready
 * watch or return an existing one if already instanciated.
 * If we want to force instanciation then set the second parameter to true
 *
 * Alternate use, attach to the 'main' ready event by giving a function as
 * the first parameter.
 *
 * @param {string|function} nameId Unique identifier or function that will attach
 *      to our framework's main ready event...
 * @param {boolean=} opt_forceInit If we need to force Init
 * @return {ss.ready.C}
 */
ss.ready = function(nameId, opt_forceInit)
{
  var c;
  if(goog.isFunction(nameId)) {
    // for calls with a listener, assign the listener
    // to our main ready watch
    c = ss.ready.getInstance(ss.ready.MAIN);
    c.addListener(nameId);
    return c;
  }

  c = ss.ready.getInstance(nameId);
  if (opt_forceInit) {
      // we want to force initialize --> overwrite
      c = new ss.ready.C(nameId);
      ss.ready.db.allReady.set(nameId, c);
  }
  return c;
}; // ss.ready

/** @const {string} The main ready watch */
ss.ready.MAIN = 'main';

/**
 * Static Data Container
 */
ss.ready.db = {
    allReady: new goog.structs.Map()
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
  var c = ss.ready.db.allReady.get(nameId);
  if (c)
    return c;

  c = new ss.ready.C(nameId);
  ss.ready.db.allReady.set(nameId, c);
  return c;
};

/**
 * The ready watch Class
 * Do not call this directly, use ss.ready() as the main
 * entry point
 *
 * @param {string} nameId The name of our ready watch
 * @constructor
 * @return {this}
 */
ss.ready.C = function(nameId)
{
  this.nameId = nameId;
  this.fn = new goog.structs.Map();
  this.checks = new goog.structs.Map();
  this.fnCheck = new goog.structs.Map();
};

/**
 * The instance's name id
 * @private
 * @type {string}
 */
ss.ready.C.prototype.nameId;


/**
 * Switch to let us know if the ready watch has finished
 * @private
 * @type {boolean}
 */
ss.ready.C.prototype.done = false;

/**
 * Each check object has:
 *
 * @typedef {{checkId: string, done: boolean}}
 */
ss.ready.checkObject;

/**
 * Each listener function object has:
 * @typedef {{fn: Function(), delay: number}} Delay in ms, 0 = none
 */
ss.ready.listenerObject;

/**
 * Each Check Listener function object has:
 * @typedef {{checkId: string, fn: Function()}}
 */
ss.ready.checkListenerObject;

/**
 * An array of check objects
 *
 * @type {goog.structs.Map.<ss.ready.checkObject>}
 */
ss.ready.C.prototype.checks;

/**
 * Listeners to execute when the ready watch
 * finishes.
 * @private
 * @type {goog.structs.Map.<ss.ready.listenerObject>}
 */
ss.ready.C.prototype.fn;

/**
 * Check only listeners
 * @private
 * @type {goog.structs.Map<goog.structs.Map.<ss.ready.checkListenerObject>>}
 */
ss.ready.C.prototype.fnCheck;



/**
 * Checks if a certain name exists and has finished
 * doing it's stuff...
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
  return this.checks.get(checkId).done || false;
}; // method ss.ready.isDoneCheck



/**
 * Pushes a listener function down the ready queue...
 *
 * @param {Function()} fn callback function
 * @param {number} opt_delay optionaly set a delay to execute fn in ms
 * @return {number} unique id you can use to remove the listener
 */
ss.ready.C.prototype.addListener = function(fn, opt_delay)
{
  // if watch is finished then we execute the function right away...
  if (this.isDone()) {
      fn();
      return;
  }

  // push the function object after we create it
  var fnObj = {
    fn: fn,
    delay: opt_delay || 0
  };

  var uid = goog.getUid(fnObj);
  this.fn.set(uid, fnObj);
  return uid;

}; // method ss.ready.addListener

/**
 * Remove a listener function
 * @param {number} uid
 * @return {void}
 */
ss.ready.C.prototype.removeListener = function (uid)
{
  this.fn.remove(uid);
};

/**
 * Adds a listener for a specific check instead of the whole
 * ready watch
 *
 * @param {string} checkId The name of the check ID
 * @param {Function()} fn callback function
 * @return {number} unique id you can use to remove the check listener
 */
ss.ready.C.prototype.addCheckListener = function(checkId, fn)
{
  // if check or watch is finished then we execute the function right away...
  if (this.done || this.isDoneCheck(checkId)) {
      fn();
      return NaN;
  }

  // see if we can find this check
  var arCheck = this.checks.get(checkId);
  if (!arCheck) {
      // no, doesn't exist, create it
      this.addCheck(checkId);
  } // if we didn't find the check

  // construct the object to store
  var obj = {
    checkId: checkId,
    fn: fn
  };
  var uid = goog.getUid(obj);

  // store it
  this.fnCheck.set(uid, obj);

  return uid;

};

/**
 * Remove a check listener function
 * @param {number} uid
 */
ss.ready.C.prototype.removeCheckListener = function (uid)
{
  this.fnCheck.remove(uid);
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
  var check = this.checks.get(checkId);
  if (!check) {
      // yup, not found...
      this.checks.set(checkId, {
          checkId: checkId,
          done: false
      });
  }
}; // method ss.ready.addCheck


/**
 * Marks a check watch as done, if it's the last one to check
 * then we execute the ready function
 *
 * @param {string} checkId The check string id we will use as a switch
 * @param {boolean=} opt_state If check method failed, set this to false
 * @return void
 */
ss.ready.C.prototype.check = function(checkId, opt_state)
{
  // find the check string in our map of checks...
  var check = this.checks.get(checkId);

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
  this.checks.set(checkId, check);

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
ss.ready.C.prototype._isChecksComplete = function (nameId)
{
  // check if we have no checks in this watch
  var checks = this.checks.getValueIterator();
  var check;
  /** @preserveTry */
  try {
  while(check = checks.next()) {
    if (!check.done)
      return false;
  }
  } catch(e) {}
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
  // go for all checks listeners first
  var fnChecks = this.fnCheck.getValueIterator();
  var fnCheck;
  /** @preserveTry */
  try {
  while(fnCheck = fnChecks.next()) {
      goog.isFunction(fnCheck.fn) && fnCheck.fn();
  };
  } catch(ex) {}
  // empty the array
  this.fnCheck.clear();

  // now go for all main ready watch listeners
  var fns = this.fn.getValueIterator();
  var fnObj;
  /** @preserveTry */
  try {
  while(fnObj = fns.next()) {
    if (goog.isFunction(fnObj.fn)) {
      // exec callback method with state of execution after set delay...
      if (0 == fnObj.delay)
        fnObj.fn();
      else
        setTimeout(fnObj.fn, fnObj.delay);
    }
  };
  } catch(ex){}
  // reset function container array of watch...
  this.fn.clear();
}; // ss.ready._runAll


/**
 * Run all listeners for a specific check
 *
 *
 * All listeners will be deleted after run
 *
 * @param {string} checkId The check we want to execute the listeners of
 * @return {void}
 */
ss.ready.C.prototype._runAllChecks = function(checkId)
{
  // if check isn't there, exit
  if (!this.checks.get(checkId))
    return;
  var fnChecks = this.fnCheck.getKeyIterator();
  var localfnCheckKey, fnCheck, removeKeys = [];
  // loop through all check listeners, if we find a match for the
  // given checkId execute and push to removeKeys
  /** @preserveTry */
  try {
  while(localfnCheckKey = fnChecks.next()) {
    fnCheck = this.fnCheck.get(localfnCheckKey);
    if(fnCheck.checkId == checkId) {
      goog.isFunction(fnCheck.fn) && fnCheck.fn();
      removeKeys.push(localfnCheckKey);
    }
  }
  } catch(ex) {}
  // remove all the executed funcs
  var l = removeKeys.length;
  for (var i = 0; i < l; i++) {
    this.fnCheck.remove(removeKeys[i]);
  }
};