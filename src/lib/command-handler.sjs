const EventEmitter = require('after-events');
const inspect = require('util').inspect;
const format = require('util').format;
const lodash = require('lodash');
const Response = require('./response');
const Promise = require('bluebird');

const badResponseFormat = 'Command handler for %s returned with invalid value: %s';

function Command (privmsg, command_text) {
    const args = command_text.split(/ +/);
    const commandname = args.shift().toLowerCase();

    return lodash.create(privmsg, {
        args: args,
        command: commandname
    });
}

function startsWith(str, prefix) {
    return str.substring(0, prefix.length) === prefix;
}

// nickname is a function that returns the nickname of the client.
function CommandParser (config, client, nickname, logger) {
    var trigger = config['command-trigger'] || '!';

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

        if (startsWith(privmsg.message.toLowerCase(), nickname().toLowerCase())) {
            // Trimming in case of multiple spaces. e.g. (raw message)
            // nick!user@host PRIVMSG #chan botname:   do something
            const message = privmsg.message.substring(privmsg.message.indexOf(' ') + 1).trim();
            return startsWith(message, trigger) ? removeTrigger(message) : message;
        }

        return false;
    };

    const parser = Object.create(EventEmitter());

    parser.parse = function (privmsg) {
        const maybeCommand = getMaybeCommandString(privmsg);

        if (maybeCommand) {
            const command = Command(privmsg, maybeCommand);
            logger.notice('Command Handler', 'Emitting command:', command.command);


            this.emit(command.command, command);
            return command;
        }
    };

    parser.after(function (err, res, type, command) {
        // Intent := "say" | "act" | "ctcp" | "notice" | "none"
        // Target: NickName | ChannelName
        // ReturnResponse := {message: String | [CtcpType, CtcpBody], intent: Intent, target: Target, query: Boolean}
        // Result = undefined | string | [string] | ReturnResponse

        // err := Error
        // res := Result | Promise<Result>
        // type := string
        // command := Command

        if (err) {
            logger.error('CommandHandler', 'Error thrown in message handler!');
            logger.error('CommandHandler', err.stack);
            return;
        }

        if (command.channel !== undefined) {
            Promise.resolve(res)
            .then(λ[Response.create(#, command)])
            .then(λ[Response.send(#, client)])
            .catch(logBadResponseError)
        }

        function logBadResponseError (err) {
            logger.error('CommandHandler', format(badResponseFormat, command.message, inspect(res)));
        }
    });

    return parser;
};

module.exports = CommandParser;