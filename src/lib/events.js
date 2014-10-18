/**
 * EventEmitter wrapper which wraps on, once, and emit so that they may
 *  * on/once can take a map of events to listeners.
 *  * listen/emit multiple events by seperating events with a space.
 */

var events = require('events');

var EventEmitter = function () {
    events.EventEmitter.call(this);
};

var onString = function (ee, string, listener) {
    string.split(" ").forEach(function (event) {
        events.EventEmitter.on.call(ee, event, listener);
    });
};

var onMap = function (ee, map) {
    for (var event in map) {
        onString(ee, event, map[event]);
    }
};

var onceString = function (ee, string, listener) {
    string.split(" ").forEach(function (event) {
        events.EventEmitter.once.call(ee, event, listener);
    });
};

var onceMap = function (ee, map) {
    for (var event in map) {
        onceString(ee, event, map[event]);
    }
};

EventEmitter.prototype.on = function () {
    switch (arguments.length) {
        case 1: onMap(this, arguments[0]); break;
        case 2: onString(this, arguments[0], arguments[1]); break;
        default: throw new Exception("on takes one or two arguments.");
    }
};

EventEmitter.prototype.once = function () {
    switch (arguments.length) {
        case 1: onceMap(this, arguments[0]); break;
        case 2: onceString(this, arguments[0], arguments[1]); break;
        default: throw new Exception("on takes one or two arguments.");
    }
};

EventEmitter.prototype.emit = function (toEmit) {
    toEmit.split(" ").forEach(function (event) {
        events.EventEmitter.emit.call(this, event);
    });
};

module.exports = {
    "EventEmitter" : EventEmitter
};