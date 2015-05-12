const format = require("util").format;
const packageMetadata = require("../package.json");
const create = require("lodash.create");

const isCtcp = function (message) {
    return message[0] === "\u0001" && message[message.length - 1] === "\u0001";
};

function Ctcp (privmsg) {
    const args = privmsg.message.slice(1, -1).split(/ +/);
    const commandName = args.shift().toLowerCase();

    return create(privmsg, {
        args: args,
        command: commandName
    });
}

module.exports = {
    init: function (client, deps) {
        // invariant: keys must be normalized to lower case.
        const registry = {};

        // Add here and not in handlers because we cannot guarantee that
        // "subscribe" is handled before "handlers".
        registry.version = function (ctcp) {
            return format("Tennu %s (https://tennu.github.io)", packageMetadata["version"]);
        }

        return {
            handlers: {
                "privmsg": function (privmsg) {
                    if (!isCtcp(privmsg.message)) {
                        return;
                    }

                    const ctcp = Ctcp(privmsg);
                    client.note(format("Ctcp message '%s' detected.", ctcp.command));

                    if (ctcp.command in registry) {
                        const response = registry[ctcp.command](ctcp);

                        if (response) {
                            client.ctcpRespond(privmsg.nickname, ctcp.command, response);
                        }
                    } else {
                        client.note(format("Unknown ctcp request '%s'.", ctcp.command));
                    }
                }
            },

            subscribe: {
                prefix: "ctcp:",
                emitter: {
                    on: function (ctcpName, handler) {
                        ctcpName = ctcpName.toLowerCase();

                        if (ctcpName in registry) {
                            throw new Error(format("Command '%s' already has a handler.", ctcpName));
                        }

                        registry[ctcpName] = handler;
                    },

                    off: function () {
                        throw new Error("Cannot remove command handlers once attached.");
                    },

                    once: function () {
                        throw new Error("Cannot only listen to a command once.");
                    }
                }
            }
        };
    },

    requires: ["subscriber", "messages", "action"]
};