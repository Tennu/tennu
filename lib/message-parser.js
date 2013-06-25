/**
 * This event emitter listens to an IRC Socket and converts all messages to
 * Message objects which it emits under events of the Message.name field.
 * Some example events include:
 *  join
 *  error (when quitting/forced to quit)
 *  005
 *
 * The constructor takes two arguments:
 *   1. receiver - The nominal receiver of the object.
 *   2. socket   - EventEmitter emitting ('data', RFC1459Message) <Optional>
 *
 * If you do not attach a socket to it, you can manually feed messages with
 * the parse method.
 *
 * You can add multiple input sockets with the listen method.
 */

/*
*/

var events = require('events');
var util = require('util');

var Message = require('./structures/message');

var MessageParser = function (context, socket) {
    this.context = context;

    if (socket) {
        this.listen(socket);
    }
};

MessageParser.prototype = Object.create(events.EventEmitter.prototype);
MessageParser.prototype.constructor = MessageParser;

MessageParser.prototype.parse = function (raw) {
    var message = Object.freeze(new Message(raw, this.context));
    this.emit(message.name, message, this.context);
    this.emit("_message", message, this.context);
    return message;
};

MessageParser.prototype.listen = function (socket) {
    socket.on('data', this.parse.bind(this));
};

MessageParser.prototype.toString = function () {
    return "[Object MessageParser]";
};

module.exports = MessageParser;