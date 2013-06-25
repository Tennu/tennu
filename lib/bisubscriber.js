/**
 * BiEventSubscriber Class
 *
 * This event subscriber takes two event emitters, primary and secondary.
 * Events can be subscribed in two ways:
 *
 * 1. An object dictionary where the keys are the events to listen to and the
 *    and the values are the functions to register for the events.
 *
 *    Ex:  subscriber.on({"join" : onjoin, "!help !h" : onhelp});
 *
 * 2. If there's only one string/function pair, you can pass them as two
 *    arguments.
 *
 *    Ex:  subscriber.on("join", onjoin);
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
 */

/*
*/

var BiEventSubscriber = function (primary, secondary) {
    this._primary = primary;
    this._secondary = secondary;
};

BiEventSubscriber.prototype = {
    _wrap : function (fn) {
        if (typeof fn !== 'function') {
            throw new Error("BiSubscriber listeners must be a function.");
        }

        return function () {
            try {
                fn.apply(null, arguments);
            } catch (err) {
                console.log(err.stack);
            }
        };
    },

    _onString : function (string, listener) {
        string.split(" ").forEach(function (event) {
            if (event[0] === '!') {
                this._secondary.on(event.substr(1), this._wrap(listener));
            } else {
                this._primary.on(event, this._wrap(listener));
            }
        }.bind(this));
    },

    _onMap : function (map) {
        for (var event in map) {
            this._onceString(event, map[event]);
        }
    },

    _onceString : function (string, listener) {
        string.split(" ").forEach(function (event) {
            if (event[0] === '!') {
                this._secondary.once(event.substr(1), this._wrap(listener));
            } else {
                this._primary.once(event, this._wrap(listener));
            }
        }.bind(this));
    },

    _onceMap : function (ee, map) {
        for (var event in map) {
            this._onceString(event, map[event]);
        }
    },

    on : function () {
        switch (arguments.length) {
            case 1: this._onMap(arguments[0]); break;
            case 2: this._onString(arguments[0], arguments[1]); break;
            default: throw new Exception("on takes one or two arguments.");
        }
    },

    once : function () {
        switch (arguments.length) {
            case 1: return this._onceMap(arguments[0]);
            case 2: return this._onceString(arguments[0], arguments[1]);
            default: throw new Exception("on takes one or two arguments.");
        }
    }
};

module.exports = BiEventSubscriber;