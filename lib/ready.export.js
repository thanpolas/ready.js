// exports
goog.provide('ss.ready.compiled');
goog.require('ss.ready');

var c = ss.ready.C.prototype;
c['addCheck'] = c.addCheck;
c['check'] = c.check;
c["addCheckListener"] = c.addCheckListener;
c["removeCheckListener"] = c.removeCheckListener;
c["addListener"] = c.addListener;
c["removeListener"] = c.removeListener;
c["isDone"] = c.isDone;
c["isDoneCheck"] = c.isDoneCheck;

goog.exportSymbol('ss.ready', ss.ready);
goog.exportSymbol('ss.ready.C', ss.ready.C);
goog.exportSymbol('ss.ready.C.prototype', c);

// check for node.js
if (ss.NODEJS) {
	if (typeof exports === 'object' && exports) {
		exports.ready = ss.ready;
	}
}