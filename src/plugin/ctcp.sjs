//! This plugin implements basic CTCP functionality for Tennu IRC bots.
//!
//! CTCP, or Client to Client Protocol, is a protocol that tunnels over IRC
//! for letting clients query information, and also for actions (/me). See
//! http://modern.ircdocs.horse/ctcp.html for more information about what
//! CTCP is, and how it is implemented by other clients.
//!
//! We implement the following CTCP messages unconditionally:
//! VERSION, SOURCE, CLIENTINFO, PING
//! Of note, we do not implement TIME since knowing the server time for
//! an IRC bot is not useful information to share, and UTC time is shared
//! between everybody.
//!
//! We also allow other plugins to create their own response to specific
//! CTCP requests. They must add a handler of `ctcp:handler-name` that
//! is given a `Ctcp` object and must return a string response or undefined.
//!
//! The `Ctcp` object is similar to a `Command` in that it's a `Privmsg`
//! but has `args` and `command` properties.

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
        // invariant: keys must be normalized to uppercase.
        const registry = {};

        // We add base CTCP commands here instead of in the handlers
        // because there is no guarantee of the order that `handlers` and
        // `subscribe` are handled, so it's possible that `handlers` gets
        // handled before `subscribe`, and the `ctcp:` prefix isn't actually
        // available yet.

        registry.CLIENTINFO = function (_ctcp) {
            // You should notice that this behaviour can only be implemented
            // in this plugin, unlike the rest of the CTCPs.
            return Object.keys(registry).join(" ");
        };

        registry.VERSION = function (_ctcp) {
            return format("Tennu %s", packageMetadata["version"]);
        };

        registry.SOURCE = function (ctcp) {
            return "https://github.com/tennu/tennu | Docs: https://tennu.github.io"
        };

        registry.PING = function (ctcp) {
            // Example message: "\u{1}PING Part to copy here\u{1}"
            // We want to send back the "Part to copy here", so have to slice off
            // the first 6 characters and the last character.
            // We can't just do `ctcp.args.join(" ") because the part to copy
            // could have multiple spaces in it.
            return ctcp.message.slice(6, -1);
        }

        return {
            handlers: {
                "privmsg": function (privmsg) {
                    if (!isCtcp(privmsg.message)) {
                        return;
                    }

                    const ctcp = Ctcp(privmsg);
                    client.note(format("CTCP message '%s' detected.", ctcp.command));

                    if (ctcp.command.toUpperCase() in registry) {
                        const response = registry[ctcp.command.toUpperCase()](ctcp);

                        if (response) {
                            client.ctcpRespond(privmsg.nickname, ctcp.command, response);
                        }
                    } else {
                        client.note(format("Unknown CTCP request '%s'.", ctcp.command));
                    }
                }
            },

            subscribe: {
                prefix: "ctcp:",
                emitter: {
                    on: function (ctcpName, handler) {
                        ctcpName = ctcpName.toUpperCase();

                        if (ctcpName in registry) {
                            throw new Error(format("CTCP Command '%s' already has a handler.", ctcpName));
                        }

                        registry[ctcpName] = handler;
                    },

                    off: function () {
                        throw new Error("Cannot remove CTCP command handlers once attached.");
                    },

                    once: function () {
                        throw new Error("Cannot only listen to a CTCP command once.");
                    }
                }
            }
        };
    },

    requires: ["subscriber", "messages", "action"]
};