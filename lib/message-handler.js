/**
 * This event emitter listens to an IRC Socket and converts all messages to
 * Message objects which it emits under events of the Message.command field.
 *
 * If the listeners return a value, that value is broadcast to the location
 * that the event originated from, should the event originate from a channel
 * or private message.
 *
 * Numeric events are sent by both numeric and reply name.
 *
 * Example events:
 *  join
 *  error (when quitting/forced to quit)
 *  005
 *  rpl_endofwhois
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

var MessageParser = function MP (receiver, logger, socket) {
    var parser = Object.create(EventEmitter());

    parser.parse = function (raw) {
        var message = new Message(raw, receiver);

        if (message === null) {
            logger.error("Raw message given was not a valid IRC message!", raw);
            return null;
        }

        this.emit(message.command.toLowerCase(), message);

        if (message.replyname) {
            this.emit(message.replyname.toLowerCase(), message);
        }

        this.emit("*", message);

        return message;
    };

    parser.listen = function (socket) {
        socket.on('data', this.parse.bind(this));
    };

    parser.toString = function () {
        return "[Object MessageParser]";
    };

    parser.after(function (err, res, type, message) {
        if (err) {
            logger.error("Message Handler", "Error thrown in message handler!");
            logger.error("Message Handler", err.stack);
            return;
        }

        if (res === undefined) {
            return;
        }

        if (Array.isArray(res) || typeof res === "string") {
            res = Q(res);
        }

        if (typeof res.then !== 'function') {
            logger.error("Message Handler", format(badResponseFormat, message.command, String(res)));
            return;
        }

        res.then(function (res) {
            receiver.say(message.channel, res);
        });
    });

    if (socket) {
        parser.listen(socket);
    }

    return parser;
};

module.exports = MessageParser;