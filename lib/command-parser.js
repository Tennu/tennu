var events = require('events');
var util = require('util');
var create = require('lodash-node/modern/objects/create');

function Command (privmsg, command_text) {
    var args = command_text.split(/ +/);
    var command = args.shift().toLowerCase();

    return Object.freeze(create(privmsg, {
        args: Object.freeze(args),
        command: command
    }));
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
    parser.parseMessage = function (privmsg) {
        var command = getCommandString(privmsg);

        if (command) {
            debug("Command found: " + command);
            command = Command(privmsg, command);
            this.emit(command.name, command);
        }
    };
    return parser;
};
