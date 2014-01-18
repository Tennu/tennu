/**
 * BiEventSubscriber
 *
 * This event subscriber takes two event emitters, primary and secondary.
 * Events can be subscribed in two ways:
 *
 * 1. An object dictionary where the keys are the events to listen to and the
 *    and the values are the functions to register for the events.
 *
 *    Ex:  subscriber.on({'join' : onjoin, '!help !h' : onhelp});
 *
 * 2. If there's only one string/function pair, you can pass them as two
 *    arguments.
 *
 *    Ex:  subscriber.on('join', onjoin);
 *
 * The string value is a space delimited list of events to listen to. If the
 * event begins with an exclamation mark, then it will be subscribed to the
 * secondary event emitter with the exclamation mark stripped. Otherwise, the
 * listener will be subscribed to the primary event emitter.
 *
 * Event listeners will be wrapped with an error catching function that prints
 * the stacktrace to std out. If you want different behavior, modify _wrap().
 *
 * Public Methods:
 *   - new(primary: EventEmitter, secondary: EventEmitter): BiEventSubscriber
 *   - on(listenerMap: Object): undefined
 *   - on(events: string, listener: function): undefined
 *   - once(listenerMap: Object): undefined
 *   - once(events: string, listener: function): undefined
 *   - off(listenerMap: Object): undefined
 *   - off(events: string, listener: function): undefined
 */

const inspect = require('util').inspect;

const BiEventSubscriber = function (primary, secondary) {
    if (!(this instanceof BiEventSubscriber)) {
        return new BiEventSubscriber;
    }

    this._primary = primary;
    this._secondary = secondary;

    this._primaryOff = (primary.removeListener ? 'removeListener' : 'off');
    this._secondaryOff = (secondary.removeListener ? 'removeListener' : 'off');
};

BiEventSubscriber.prototype = {
    _onString : function (type, listener) {
        type.split(' ').forEach(function (event) {
            if (event[0] === '!') {
                this._secondary.on(event.substr(1), listener);
            } else {
                this._primary.on(event, listener);
            }
        }.bind(this));
    },

    _onMap : function (typemap) {
        for (var type in typemap) {
            this._onString(type, typemap[type]);
        }
    },

    _offString : function (type, listener) {
        type.split(' ').forEach(function (event) {
            if (event[0] === '!') {
                this._secondary[this._secondaryOff](event, listener);
            } else {
                this._primary['removeListener'](event, listener);
            }
        }.bind(this));
    },

    _offMap : function (typemap) {
        for (var key in typemap) {
            this._offString(key, typemap[key]);
        }
    },

    _onceString : function (type, listener) {
        type.split(' ').forEach(function (event) {
            if (event[0] === '!') {
                this._secondary.once(event.substr(1), listener);
            } else {
                this._primary.once(event, listener);
            }
        }.bind(this));
    },

    _onceMap : function (typemap) {
        for (var event in typemap) {
            this._onceString(event, map[event]);
        }
    },

    on : function () {
        switch (arguments.length) {
            case 1: this._onMap(arguments[0]); break;
            case 2: this._onString(arguments[0], arguments[1]); break;
            default: throw new Exception('on takes one (object) or two (string, fn) arguments.');
        }
    },

    off: function () {
        switch (arguments.length) {
            case 1: this._offMap(arguments[0]); break;
            case 2: this._offString(arguments[0], arguments[1]); break;
            default: throw new Exception('off takes one (object) or two (string, fn) arguments.')
        }
    },

    once : function () {
        switch (arguments.length) {
            case 1: return this._onceMap(arguments[0]);
            case 2: return this._onceString(arguments[0], arguments[1]);
            default: throw new Exception('on takes one (object) or two (string, fn) arguments.');
        }
    }
};

module.exports = BiEventSubscriber;