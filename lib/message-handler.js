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
 * The constructor takes three arguments:
 *   1. client - The nominal client of the message.
 *   2. logger - Logger object.
 *   3. socket - <Optional> EventEmitter emitting ('data', RFC1459Message)
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

var util = require('util');
var EventEmitter = require('after-events');
var Message = require('./message');

var MessageParser = function MP (client, logger, socket) {
    var parser = Object.create(EventEmitter());
    var isupport;

    parser.parse = function (raw) {
        var message = new Message(raw, isupport);

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

    parser.after(function (err, res, type, message) {
        // err := Error
        // res := string U [string] U {message: string, query: boolean?, intent: ('say' | 'act')?, target: target?}
        // type := string
        // message := message

        if (err) {
            logger.error('Message Handler', 'Error thrown in message handler!');
            logger.error('Message Handler', err.stack);
            return;
        }

        // Tests require that the undefined case return immediately.
        if (res === undefined) {
            return;
        }

        logger.debug('Message Handler', 'Response exists.');

        if (Array.isArray(res) || typeof res === 'string') {
            message.receiver.say(message.channel, res);
            return;
        } 

        if (typeof res === 'object' && res.message) {
            const channel = res.query ? message.nickname :
                     /* otherwise */   (res.target || message.channel);
            const intent = res.intent === 'act' ? 'act' : 'say';

            client[intent](channel, res.message);
            return;
        }
       
        logger.error('Message Handler', format(badResponseFormat, message.message, inspect(res)));
    });

    parser.toString = function () {
        return "[Object MessageParser]";
    };

    parser.isupport = function (value) {
        isupport = value;
    };

    if (socket) {
        parser.listen(socket);
    }

    return parser;
};

module.exports = MessageParser;