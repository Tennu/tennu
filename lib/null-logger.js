var noop = function () {
};
var null_logger = {
        debug: noop,
        info: noop,
        notice: noop,
        warn: noop,
        error: noop,
        crit: noop,
        alert: noop,
        emerg: noop
    };
module.exports = function () {
    return null_logger;
};