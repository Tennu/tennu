var EventEmitter = require('events').EventEmitter;
var util = require('util');
var create = require('lodash');

function Command (privmsg, command_text) {
    var args = command_text.split(/ +/);
    var command = args.shift().toLowerCase();

    return lodash.create(privmsg, {
        args: freeze(args),
        command: command
    });
}

function startsWith(str, prefix) {
    return str.substr(0, prefix.length) === prefix;
}

// nick is a function that returns the name
function CommandParser (nickname, config) {
    var trigger = config.trigger || "!";

    function getCommandString (privmsg) {
        function removeTrigger (string) {
            return string.substr(trigger.length);
        }

        if (startsWith(privmsg.message, trigger) || privmsg.isQuery) {
            return removeTrigger(privmsg.message);
        }

        if (privmsg.isQuery) {
            return privmsg.message;
        }

        if (startsWith(privmsg.message, nickname())) {
            // Trimming in case of multiple spaces. e.g. (raw message)
            // nick!user@host PRIVMSG #chan botname:   do something
            var message = privmsg.message.substr(privmsg.message.indexOf(" ") + 1).trim();
            return startsWith(message, trigger) ? removeTrigger(message) : message;
        }

        return false;
    };

    // I'd return a function, but a function can't emit events.
    var parser = Object.create(EventEmitter.prototype);
    parser.parse = function (privmsg) {
        var command = getCommandString(privmsg);

        if (command) {
            command = Command(privmsg, command);
            this.emit(command.name, command);
        }
    };
    return parser;
};

module.exports = CommandParser;