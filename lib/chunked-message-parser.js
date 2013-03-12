var util = require('util');
var events = require('events');

var ChunkedMessageParser = function (messageParser) {
    if (messageParser) {
        this.listen(messageParser);
    }
};

ChunkedMessageParser.prototype = new events.EventEmitter();

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