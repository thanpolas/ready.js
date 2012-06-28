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

/**

// Export ready symbols
goog.exportSymbol('ss.ready', ss.ready);
goog.exportSymbol('ss.ready.C', ss.ready.C);
goog.exportSymbol('ss.ready.C.prototype.addCheck', ss.ready.C.prototype.addCheck);
goog.exportSymbol('ss.ready.C.prototype.check', ss.ready.C.prototype.check);
goog.exportSymbol('ss.ready.C.prototype.addCheckListener', ss.ready.C.prototype.addCheckListener);
goog.exportSymbol('ss.ready.C.prototype.removeCheckListener', ss.ready.C.prototype.removeCheckListener);
goog.exportSymbol('ss.ready.C.prototype.addListener', ss.ready.C.prototype.addListener);
goog.exportSymbol('ss.ready.C.prototype.removeListener', ss.ready.C.prototype.removeListener);
goog.exportSymbol('ss.ready.C.prototype.isDone', ss.ready.C.prototype.isDone);
goog.exportSymbol('ss.ready.C.prototype.isDoneCheck', ss.ready.C.prototype.isDoneCheck);
*/