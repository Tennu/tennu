/**
 * This event emitter listens to an IRC Socket, emitting parsed messages.
 * Here are some example messages:
 *  join
 *  error (when quitting/forced to quit)
 *  005
 *
 * This one also joins all channels and identifies to nickserv.
 * It probably shouldn't...
 *
 * The constructor takes three arguments:
 * IRCSocket - implementing the IRCSocket interface.
 * Config - A data object with the following fields:
 *   password
 *   nickserv
 *   channels
 *   (It shouldn't need to know any of these!)
 * IRCClient - An object that abstracts the sending of messages to the socket.
 * Should be - Object that `receives` the message.
 */

 var events = require('events');
 var util = require('util');

 var Message = require('./structures/message');

 var IRCMessageHandler = function (IRCMessageEmitter, config, client) {
    this.nrc = client;
    IRCMessageEmitter.on('data', this._onData.bind(this));
    IRCMessageEmitter.on('ready', this._onReady(config.password, config.nickserv, config.channels).bind(this));
};

IRCMessageHandler.prototype = new events.EventEmitter();
IRCMessageHandler.prototype.constructor = IRCMessageHandler;

IRCMessageHandler.prototype._onData = function (raw) {
    var message = Object.freeze(new Message(raw, this.nrc));
    this.emit(message.name, message);
};

// This should be handled by the Socket.
IRCMessageHandler.prototype._onReady = function (password, nickserv, channels) {
    var that = this;
    return function () {
        if (password) {
            this.nrc.say(nickserv, "identify " + password);
        }

        for (var ix = 0; ix < channels.length; ix++) {
            this.nrc.join(channels[ix]);
        }

        that.emit("ready");
    };
};

IRCMessageHandler.prototype.toString = function () {
    return "[Object IRCMessageHandler]";
};

module.exports = IRCMessageHandler;