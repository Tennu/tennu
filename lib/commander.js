/**
 *
 * Command Handler
 *
 */

var events = require('events');
var util = require('util');

var Command = require('./structures/command');

/**
 * @constructor
 * @param {NRC} nrc Context to which the commander listens upon. Must be an
 * event emitter that emits the 'privmsg' event.
 * @param {Object} config Configuration object. See Readme.md for options.
 */
var Commander = function (ctx, config) {
    events.EventEmitter.call(this);
    var that = this;
    this.ctx = ctx;
    this.trigger = config.trigger || "!";
};

Commander.prototype = new events.EventEmitter();
Commander.prototype.constructor = Commander;

/**
 * Rebinding of on to bind |this| to the passed in context, in this case the
 * NRC object.
 * @param message Message to listen to.
 * @param callback Function to execute when message emitted.
 */
Commander.prototype.on = function (message, callback) {
    events.EventEmitter.prototype.on.call(this, message,
        callback.bind(this.ctx));
};

Commander.prototype.parseMessage = function (msg) {
    var command = this.getCommandString(msg);

    if (command) {
        command = Object.freeze(new Command(msg.actor, command,
            msg. channel, msg.isQuery));
        this.emit(command.name, command);
    }
};

Commander.prototype.getCommandString = function (privmsg) {
    if (privmsg.message[0] === this.trigger[0]) {
        return privmsg.message.substr(1);
    }

    if (privmsg.isQuery) {
        return privmsg.message;
    }

    if (privmsg.message.indexOf(this.ctx.nick()) === 0) {
        var msg = privmsg.message.substr(privmsg.message.indexOf(" ") + 1);

        if (msg[0] === this.trigger[0]) {
            return msg.substr(1);
        } else {
            return msg;
        }
    }

    return false;
};

module.exports = Commander;
