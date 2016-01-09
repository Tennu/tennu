const inspect = require("util").inspect;
const format = require("util").format;
const create = require("lodash.create");
const Promise = require("bluebird");

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
    name: "commands",

    configDefaults: {
        "command-trigger": "!",
        "command-ignore-list": []
    },

    init: function (client, deps) {
        const trigger = client.config("command-trigger");
        const ignoreList = client.config("command-ignore-list");

        client.debug("ignoreList is " + require("util").inspect(ignoreList));

        const isValidIgnorableCommand = function (ignoredCommand) {
            return typeof ignoredCommand === "string" ||
                (Array.isArray(ignoredCommand) &&
                    ignoredCommand.every(λ[typeof # === "string"]));
        };
        if (!ignoreList.every(isValidIgnorableCommand)) {
            throw new Error("Invalid command-ignore-list configuration option value. " + 
                "Must either be a string or an array of multiple strings where the first value " +
                "is the command to ignore and the rest are plugins to ignore it from.");
        }

        const ignoreCommandInSpecificPluginList = ignoreList
        .filter(λ[Array.isArray(#)])
        .map(function (commandPluginsList) {
            return commandPluginsList.map(λ[#.toLowerCase()]);
        });
        const globalIgnoreItems = ignoreList.filter(λ[typeof # === "string"]).map(λ[#.toLowerCase()]);

        // invariant: keys must be normalized to lower case.
        const registry = {};

        // Pushed to by the `commandMiddleware` hook; Read by the `privmsg` handler.
        const middleware = [];

        /// Returns false if privmsg is *not* a command query.
        /// Otherwise, returns the string that is the command query.
        /// e.g.  "commandname arg1 arg2 ..."
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
                    // TODO(Havvy): use R-Result to simplify.
                    const maybeCommandString = tryParseCommandString(privmsg);

                    if (!maybeCommandString) {
                        return;
                    }

                    const command = Command(privmsg, maybeCommandString);
                    client.note("PluginCommands", format("Command detected: %s", command.command));

                    const promiseOfCommandOrResponse = middleware.reduce(function (promiseOfCommandOrResponse, ware) {
                        return promiseOfCommandOrResponse.then(function (commandOrResponse) { 
                            if (commandOrResponse === command) {
                                return ware(commandOrResponse);
                            } else {
                                return commandOrResponse;
                            }
                        });
                    }, Promise.resolve(command));

                    return promiseOfCommandOrResponse.then(function (commandOrResponse) {
                        if (commandOrResponse !== command) {
                            // It's a Response.

                            client.note("PluginCommands", "Command handled by middleware.");
                            return commandOrResponse;
                        }

                        // It's still the same command as above. We can continue using that variable.
                        const commandName = command.command;
                        client.note("PluginCommands", format("Command after middleware: %s", commandName));
                        const maybeCommandRegistryEntry = registry[commandName];

                        if (!maybeCommandRegistryEntry) {
                            client.note("PluginCommands", format("Handler for '%s' not found.", commandName));
                            return;
                        }
                        const commandRegistryEntry = maybeCommandRegistryEntry;

                        const handler = commandRegistryEntry.handler;
                        const plugin = commandRegistryEntry.plugin;

                        client.note("PluginCommands", format("Handler '%s:%s' found.", plugin, commandName));
                        
                        return handler(command);
                    });
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
                        
                        if (globalIgnoreItems.indexOf(commandName) !== -1) {
                            client.note("PluginCommands", format("Ignoring '%s:%s (global)'.", plugin, commandName));
                            return;
                        }
                        
                        var ignoreMatchFound = ignoreCommandInSpecificPluginList.some(function (element, index, array) {
                            if (element[0] === commandName && element.slice(1, element.length).indexOf(plugin) !== -1) {
                                client.note("PluginCommands", format("Ignoring '%s:%s'.", plugin, commandName));
                                return true;
                            }
                        });
                        if (ignoreMatchFound) {
                            return;
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

                    off: function (commandName) {
                        if (commandName in registry) {
                            delete registry[commandName];
                        } else {
                            const error = format("Cannot remove command handler '%s', as there is no such command handler.", commandName);
                            client.error(error);
                            throw new Error(error);
                        }
                    },

                    once: function () {
                        throw new Error("Cannot only listen to a command once.");
                    }
                }
            },

            hooks: {
                commandMiddleware: function (plugin, ware) {
                    if (typeof ware !== "function") {
                        const error = format("Plugin %s tried to add non-function middleware.", plugin);
                        client.error(error);
                        throw new Error(error);
                    }

                    middleware.push(ware);
                }
            },

            exports: {
                isCommand: function (message) {
                    return tryParseCommandString(message) !== false;
                },

                isHandledCommand: function (message) {
                    const maybeCommand = tryParseCommandString(message);

                    if (!maybeCommand) {
                        return false;
                    }

                    const command = Command(message, maybeCommand);
                    const commandName = command.command;
                    const commandRegistryEntry = registry[command.command];

                    return commandRegistryEntry !== undefined;
                }
            }
        };
    },

    requires: ["subscriber", "messages", "self"]
};