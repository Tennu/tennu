/**
 *
 * Command Handler
 *
 */

var events = require('events');
var util = require('util');

var Command = require('./structures/command');

/**
 * ctx: NRC interface
 */
var Commander = function (name, config) {
    events.EventEmitter.call(this);
    var that = this;
    this._name = name;
    this.trigger = config.trigger || "!";
};

Commander.prototype = new events.EventEmitter();
Commander.prototype.constructor = Commander;

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

    if (privmsg.message.indexOf(this._name()) === 0) {
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
