const EventEmitter = require('after-events');
const inspect = require('util').inspect;
const format = require('util').format;
const lodash = require('lodash');

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
        // err := Error
        // res := string U [string] U {message: string, query: boolean?, intent: ('say' | 'act')?, target: target?}
        // type := string
        // commmand := commmand

        if (err) {
            logger.error('Command Handler', 'Error thrown in command handler!');
            logger.error('Command Handler', err.stack);
            return;
        }

        // Tests require that the undefined case return immediately.
        if (res === undefined) {
            return;
        }

        logger.debug('Command Handler', 'Response exists.');

        if (Array.isArray(res) || typeof res === 'string') {
            client.say(command.channel, res);
            return;
        } 

        if (typeof res === 'object' && res.message) {
            const channel = res.query ? command.nickname :
                     /* otherwise */   (res.target || command.channel);
            const intent = res.intent === 'act' ? 'act' : 'say';

            client[intent](channel, res.message);
            return;
        }
       
        logger.error('Command Handler', format(badResponseFormat, command.command, inspect(res)));
    });

    return parser;
};

module.exports = CommandParser;