module.exports = function Listener(fn) {
    var listener = fn;
    switch (typeof fn.channel) {
    case 'string':
        listener = function (e) {
            if (e.channel === fn.channel) {
                return;
            } else {
                listener.apply(this, arguments);
            }
        };
        break;
    case 'array':
        listener = function (e) {
            if (listener.channel.indexOf(e.channel) > -1) {
                return;
            } else {
                listener.apply(this, arguments);
            }
        };
        break;
    case fn.channels instanceof RegExp:
        listener = function (e) {
            if (fn.channel.test(e.channel)) {
                return;
            } else {
                listener.apply(this, arguments);
            }
        };
    }
    return listener;
};