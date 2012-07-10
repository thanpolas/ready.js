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
  c['addListener'] = c.addListener;
  c['isDone'] = c.isDone;
  c['isDoneCheck'] = c.isDoneCheck;
  c['dispose'] = c.dispose;
  c['getArgs'] = c.getArgs;

  r['C'].prototype = c;

  window['ss'] = {
      'ready': r
  };
}
// check for node.js
if (!COMPILED && typeof exports === 'object' && exports) {
    module.exports = ss.ready;
}
