var util = require('util');
var events = require('events');

var ChunkedMessageParser = function (messageParser) {
    var parser = Object.create(ChunkedMessageParser.prototype);
    if (messageParser) {
        this.listen(messageParser);
    }
};

ChunkedMessageParser.prototype = Object.create(events.EventEmitter.prototype);
ChunkedMessageParser.prototype.constructor = ChunkedMessageParser;

ChunkedMessageParser.prototype.parse = function (message) {
    this.defaultAction(message);
};

ChunkedMessageParser.prototype.listen = function (messageParser) {
    messageParser.on('_message', this.parse.bind(this));
};

ChunkedMessageParser.prototype.defaultAction = function (message) {
    this.emit(message.name, message);
};

module.exports = ChunkedMessageParser;

// ---------------------------------------------------------------------------

module.exports.MotdHandler = function () {
    motd = [];

    // 372 - MOTD, 376 - MOTD over
    return {
        "372" : function (msg) {
            motd.push(msg.args[2]);
        },

        "376" : function (msg) {
            cMsg = Object.create(msg);
            cMsg.name = 'motd';
            cMsg.motd = motd;
            return cMsg;
        }
    };
};

module.exports.BanHandler = function () {
    bans = [];

    return {
        // ...
    };
};