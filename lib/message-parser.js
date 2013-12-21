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
var Message = require('./message');

var MessageParser = function MP (receiver, socket, logger) {
    var parser = Object.create(EventEmitter());

    parser.parse = function (raw) {
        var message = new Message(raw, receiver);
        this.emit(message.command.toLowerCase(), message);
        this.emit("*", message);
        return message;
    };

    parser.listen = function (socket) {
        socket.on('data', this.parse.bind(this));
    };

    parser.toString = function () {
        return "[Object MessageParser]";
    };

    parser.after(function (err, toSay, type, message) {
        if (err) {
            logger.error("Error thrown in message handler: ", err);
            return;
        } 

        if (Array.isArray(toSay) || typeof toSay === "string") {
            receiver.say(message.channel, toSay);;
        } else if (toSay !== undefined) {
            logger.error("Listener returned with non-string/non-array value: ", toSay);
        }
    });

    if (socket) {
        parser.listen(socket);
    }

    return parser;
};

module.exports = MessageParser;