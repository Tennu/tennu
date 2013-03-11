/**
 * This event emitter listens to an IRC Socket and converts all messages to
 * Message objects which it emits under events of the Message.name field.
 * Some example events include:
 *  join
 *  error (when quitting/forced to quit)
 *  005
 *
 * The constructor takes two arguments:
 *   1. socket   - Implementing the IrcSocket interface.
 *   2. receiver - The nominal receiver of the object.
 */

/*
This is very close to a pure actor.
Just need class syntax and fat arrow syntax and this will look beautiful.
*/

var events = require('events');
var util = require('util');

var Message = require('./structures/message');

var MessageParser = function (receiver, socket) {
    this.receiver = receiver;
    socket.on('data', this._onData.bind(this));
};

MessageParser.prototype = new events.EventEmitter();
MessageParser.prototype.constructor = MessageParser;

MessageParser.prototype._onData = function (raw) {
    var message = Object.freeze(new Message(raw, this.receiver));
    this.emit(message.name, message);
    this.emit("_message", message);
};

MessageParser.prototype.toString = function () {
    return "[Object MessageParser]";
};

module.exports = MessageParser;