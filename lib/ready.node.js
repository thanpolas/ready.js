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
