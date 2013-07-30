var events = require('events');
var util = require('util');
var startsWith = require('mout').string.startsWith;

var Command = require('./structures/command');

var debug = function (msg) {
    if (false) {
        console.log(Date().toString() + "|CP|" + msg);
    }
};

module.exports = function CommandParser (name, config) {
    var trigger = config.trigger || "!";

    var getCommandString = function (privmsg) {
        if (startsWith(privmsg.message, trigger)) {
            return privmsg.message.substr(trigger.length);
        }

        if (privmsg.isQuery) {
            return privmsg.message;
        }

        if (privmsg.message.indexOf(name()) === 0) {
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
            debug("Command found: " + command);
            command = Object.freeze(Command(msg.actor,
                command,
                msg.channel,
                msg.isQuery));
            this.emit(command.name, command);
        }
    };
    return parser;
};
