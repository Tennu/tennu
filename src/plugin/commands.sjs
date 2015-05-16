const inspect = require("util").inspect;
const format = require("util").format;
const create = require("lodash.create");

const badResponseFormat = "Command handler for %s returned with invalid value: %s";

function Command (privmsg, command_text) {
    const args = command_text.split(/ +/);
    const commandName = args.shift().toLowerCase();

    return create(privmsg, {
        args: args,
        command: commandName
    });
}

function startsWith(string, prefix) {
    return string.slice(0, prefix.length) === prefix;
}

module.exports = {
    init: function (client, deps) {
        var trigger = client.config("command-trigger");
        trigger = typeof trigger === "string" ? trigger : "!";

        const ignoreList = (client.config("command-ignore-list") || []).map(λ[#.toLowerCase()]);

        // invariant: keys must be normalized to lower case.
        const registry = {};

        // Returns false if privmsg is *not* a command query.
        // Otherwise, returns the string that is the command query.
        // e.g.  "commandname arg1 arg2 ..."
        function tryParseCommandString (privmsg) {
            function removeTrigger (string) {
                return string.slice(trigger.length);
            }

            // Message is a CTCP (probably)
            // BTW, This prevents actions from being commands.
            if (privmsg.message[0] === "\u0001") {
                return false;
            }

            // Message starts with the command trigger.
            if (startsWith(privmsg.message, trigger)) {
                return removeTrigger(privmsg.message);
            }

            // Message is in a query.
            if (privmsg.isQuery) {
                return privmsg.message;
            }

            // Message starts with my nickname.
            if (startsWith(privmsg.message.toLowerCase(), client.nickname().toLowerCase())) {
                // Trimming in case of multiple spaces. e.g. (raw message)
                // nick!user@host PRIVMSG #chan botname:   do something
                const message = privmsg.message.slice(privmsg.message.indexOf(" ") + 1).trim();
                return startsWith(message, trigger) ? removeTrigger(message) : message;
            }

            return false;
        };

        return {
            handlers: {
                "privmsg": function (privmsg) {
                    const maybeCommand = tryParseCommandString(privmsg);

                    if (!maybeCommand) {
                        return;
                    }

                    const command = Command(privmsg, maybeCommand);
                    const commandName = command.command;
                    client.note("PluginCommands", format("Command detected: %s", commandName));

                    const commandRegistryEntry = registry[command.command];

                    if (!commandRegistryEntry) {
                        client.note("PluginCommands", format("Handler for '%s' not found.", commandName));
                        return;
                    }

                    const handler = commandRegistryEntry.handler;
                    const plugin = commandRegistryEntry.plugin;

                    client.note("PluginCommands", format("Handler '%s:%s' found.", plugin, commandName));

                    // TODO(Havvy): Move to CommandPlugin.exports.subscribe.emitter.on.
                    if (ignoreList.indexOf(commandName) !== -1) {
                        client.note("PluginCommands", format("But command '%s' is ignored.", commandName));
                        return;
                    }

                    return handler(command);
                }
            },

            subscribe: {
                prefix: "!",
                acceptsMetadata: true,
                emitter: {
                    on: function (commandName, handler, metadata) {
                        commandName = commandName.toLowerCase();

                        var plugin;
                        if (metadata && metadata.plugin) {
                            plugin = metadata.plugin;
                        } else {
                            plugin = "UnknownSource";
                        }

                        if (commandName in registry) {
                            const errorMessage = format("Command '%s' already has a handler from plugin '%s'.", commandName, registry[commandName].plugin);
                            client.error("PluginCommands", errorMessage);
                            throw new Error(errorMessage);
                        }

                        client.note("PluginCommands", format("Registering '%s:%s'.", plugin, commandName));

                        registry[commandName] = {
                            handler: handler,
                            plugin: plugin
                        };
                    },

                    off: function () {
                        throw new Error("Cannot remove command handlers once attached.");
                    },

                    once: function () {
                        throw new Error("Cannot only listen to a command once.");
                    }
                }
            },

            exports: {
                isCommand: function (message) {
                    return tryParseCommandString(message) !== false;
                }
            }
        };
    },

    requires: ["subscriber", "messages", "self"]
};