/**
 * This event emitter listens to an IRC Socket and converts all messages to
 * Message objects which it emits under events of the Message.command field.
 *
 * If the listeners return a value, that value is broadcast to the location
 * that the event originated from, should the event originate from a channel
 * or private message.
 *
 * Numeric events are sent as numerics, and not by their reply name.
 *
 * Example events:
 *  join
 *  error (when quitting/forced to quit)
 *  005
 *
 * All messages can be listened to with the '*' event.
 *
 * The constructor takes two arguments:
 *   1. receiver - The nominal receiver of the message.
 *   2. socket   - <Optional> EventEmitter emitting ('data', RFC1459Message)
 *
 * MessageParser.parse(raw: String): irc-message-extended.Message
 *   Parses the message, 
 *   emits the message event, and the '*' event,
 *   and returns the message.
 *
 * MessageParser#listen(socket: Socket): void
 *   Subscribes the message parser to the socket, parsing anything sent
 *   through the 'data' event.
 *
 * MessageParser#toString(): String
 *   Returns '[Object MessageParser]'.
 */

/*
*/

var util = require('util');
var EventEmitter = require('./event-emitter');
var Message = require('./structures/message');

var MessageParser = function MP (receiver, socket) {
    var parser = Object.create(MP.prototype);

    parser.parse = function (raw) {
        var message = Object.freeze(new Message(raw, receiver));
        this.emit(message.command, message, respond);
        this.emit("*", message, respond);
        return message;
    };

    parser.then(function (toSay, type, message) {
        if (!message.channel || !toSay) {
            return;
        }

        receiver.say(message.channel, toSay);
    });

    if (socket) {
        parser.listen(socket);
    }
};

MessageParser.prototype = (function () {
    prototype = Object.create(EventEmitter);
    prototype.constructor = MessageParser;

    prototype.listen = function (socket) {
        socket.on('data', this.parse.bind(this));
    };

    prototype.toString = function () {
        return "[Object MessageParser]";
    };

    return prototype;
}());

module.exports = MessageParser;