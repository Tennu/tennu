module.exports = function makeToString(name) {
    var count = 1;
    return function () {
        return '[Object ' + name + ':' + count + ']';
    };
};