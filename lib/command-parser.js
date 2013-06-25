/**
 *
 * Command Handler
 *
 */

 var events = require('events');
 var util = require('util');
 var startsWith = require('mout').string.startsWith;

 var Command = require('./structures/command');

 var CommandParser = function (name, config, context) {
    var trigger = config.trigger || "!";

    var getCommandString = function (privmsg) {
        if (startsWith(privmsg.message === trigger)) {
            return privmsg.message.substr(trigger.length);
        }

        if (privmsg.isQuery) {
            return privmsg.message;
        }

        if (privmsg.message.indexOf(this._name()) === 0) {
            var msg = privmsg.message.substr(privmsg.message.indexOf(" ") + 1);
            return (startsWith(msg, trigger) ? msg.substr(trigger.length) : msg);
        }

        return false;
    };

    // I'd return a function, but a function can't emit events.
    var parser = Object.create(events.EventEmitter.prototype);
    parser.parseMessage = function (msg) {
        var command = getCommandString(msg);

        if (command) {
            command = Object.freeze(new Command(msg.actor, command,
                msg, msg.channel, msg.isQuery));
            this.emit(command.name, command, context);
        }
    };
    return parser;
};

module.exports = CommandParser;
