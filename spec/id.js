// Unique idenifier generator.
// Globular scope FTW.
var id = 1;

module.exports = function () {
    return id++;
};