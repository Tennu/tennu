const EventEmitter = require("after-events");
const inspect = require("util").inspect;
const format = require("util").format;
const lodash = require("lodash");
const Response = require("../lib/response");
const Promise = require("bluebird");

const badResponseFormat = "Command handler for %s returned with invalid value: %s";

function Command (privmsg, command_text) {
    const args = command_text.split(/ +/);
    const commandname = args.shift().toLowerCase();

    return lodash.create(privmsg, {
        args: args,
        command: commandname
    });
}

function startsWith(string, prefix) {
    return string.slice(0, prefix.length) === prefix;
}

module.exports = {
    init: function (client, deps) {
        const trigger = client.config("command-trigger") || "!";

        // Returns false if privmsg is *not* a command query.
        // Otherwise, returns the string that is the command query.
        // e.g.  "commandname arg1 arg2 ..."
        function tryParseCommandString (privmsg) {
            function removeTrigger (string) {
                return string.slice(trigger.length);
            }

            if (startsWith(privmsg.message, trigger)) {
                return removeTrigger(privmsg.message);
            }

            if (privmsg.isQuery) {
                return privmsg.message;
            }

            if (startsWith(privmsg.message.toLowerCase(), client.nickname().toLowerCase())) {
                // Trimming in case of multiple spaces. e.g. (raw message)
                // nick!user@host PRIVMSG #chan botname:   do something
                const message = privmsg.message.slice(privmsg.message.indexOf(" ") + 1).trim();
                return startsWith(message, trigger) ? removeTrigger(message) : message;
            }

            return false;
        };

        const parser = Object.create(EventEmitter());

        parser.parse = function (privmsg) {
            const maybeCommand = tryParseCommandString(privmsg);

            if (maybeCommand) {
                const command = Command(privmsg, maybeCommand);
                client.note("Command Handler", "Emitting command:", command.command);

                this.emit(command.command, command);
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
                client.error("CommandHandler", "Error thrown in message handler!");
                client.error("CommandHandler", err.stack);
                return;
            }

            if (command.channel !== undefined) {
                Promise.resolve(res)
                .then(λ[Response.create(#, command)])
                .then(λ[Response.send(#, client)])
                .catch(logBadResponseError)
            }

            function logBadResponseError (err) {
                client.error("CommandHandler", format(badResponseFormat, command.message, inspect(res)));
            }
        });

        return {
            handlers: {
                "privmsg": function (privmsg) {
                    parser.parse(privmsg);
                }
            },

            subscribe: {
                prefix: trigger,
                emitter: parser
            },
        };
    },

    requires: ["subscriber", "messages", "self"]
};