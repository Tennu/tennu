/**
 *
 * Event Emitter
 *
 * Publisher/Subscriber Pattern implementation.
 *
 * Differences from Node's EventEmitter:
 *   .then(cb) method (see below)
 *   Listeners that throw errors are caught and logged to console.
 *   Listeners happen during their own turn.
 *   Listener can only listen a maximum of one time with .on()
 *   "removeListener" is called "off"
 *   No way to see if the listener is listening.  (unused)
 *   No "addListener" alias
 *   No domains                                   (unused)
 *   No erroring on unhandled error event.        (unused)
 *   No maximum listener count.                   (unused)
 *   No prototype/No `new` needed to create.
 *
 * then(callback: function (err: Error U undefined, res: Any U undefined, type: String, ...args: Any)): undefined
 *   callback is ran after every listener returns.
 *   First parameter to the callback is the error of the listener, if there is one.
 *   Second parameter to the callback is the return value of the listener, if there is one.
 *   The rest of the parameters are the parameters sent to the .emit() that triggered the listener.
 *
 * If you need one of the features this lacks that is marked unused, feel free to send a pull request/file an issue.
 * Created for the MessageParser and CommandRegistry.
 */


var Set = require('simplesets').Set;   // Still waiting on that ES6 Set API.

var EventEmitter = function () {
    var events = {};                   // Object[Set[Fn]]
    var postListenerCallback = null;   // Fn

    return {
        on: function (type, listener) {
            if (!events[type]) {
                events[type] = new Set();
            }

            events[type].add(listener);
        },
        once: function (type, listener) {
            var that = this;

            function o () {
                listener.apply(null, Array.prototype.slice.call(arguments));
                that.off(type, o);
            }

            this.on(type, o);
        },
        off: function (type, listener) {
            if (events[type]) {
                events[type].remove(listener);
            }
        },
        emit: function recur (type) {
            var args = Array.prototype.slice.call(arguments, 1);

            if (Array.isArray(type)) {
                args.unshift(null);

                type.forEach(function (t) {
                    args[0] = t;
                    recur.apply(this, args);
                });

                return;
            }

            if (!events[type]) {
                return;
            }

            events[type].each(function (listener) {
                setImmediate(function () {
                    try {
                        var res = listener.apply(null, args);
                    } catch (e) {
                        var err = e;
                    }

                    try {
                        // TODO: Give special treatment to promises.
                        if (postListenerCallback) {
                            postListenerCallback.apply(null, [err, res, type].concat(args));
                        }
                    } catch (e) {
                        console.log(e.stack);
                        throw e;
                    }
                });
            });
        },
        then: function (callback) {
            postListenerCallback = callback;
        }
    };
};

module.exports = EventEmitter;