var EventEmitter = require('./event-emitter.js');
var util = require('util');
var lodash = require('lodash');

function Command (privmsg, command_text) {
    var args = command_text.split(/ +/);
    var command = args.shift().toLowerCase();

    return lodash.create(privmsg, {
        args: args,
        command: command
    });
}

function startsWith(str, prefix) {
    return str.substring(0, prefix.length) === prefix;
}

// nickname is a function that returns the nickname of the receiver.
function CommandParser (nickname, config) {
    var trigger = config.trigger || "!";

    function getMaybeCommandString (privmsg) {
        function removeTrigger (string) {
            return string.substring(trigger.length);
        }

        if (startsWith(privmsg.message, trigger)) {
            return removeTrigger(privmsg.message);
        }

        if (privmsg.isQuery) {
            return privmsg.message;
        }

        if (startsWith(privmsg.message, nickname())) {
            // Trimming in case of multiple spaces. e.g. (raw message)
            // nick!user@host PRIVMSG #chan botname:   do something
            var message = privmsg.message.substring(privmsg.message.indexOf(" ") + 1).trim();
            return startsWith(message, trigger) ? removeTrigger(message) : message;
        }

        return false;
    };

    var parser = Object.create(EventEmitter());

    parser.parse = function (privmsg) {
        var maybeCommand = getMaybeCommandString(privmsg);

        if (maybeCommand) {
            var command = Command(privmsg, maybeCommand);
            this.emit(command.command, command);
        }

        return command;
    };

    parser.then(function (err, toSay, type, command) {
        if (err || !toSay) {
            return;
        }

        receiver.say(command.channel, toSay);
    });

    return parser;
};

module.exports = CommandParser;