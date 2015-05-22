const inspect = require("util").inspect;
const format = require("util").format;
const chunk = require("chunk");
const Promise = require("bluebird");
const EventEmitter = require("events").EventEmitter;

module.exports = ActionPlugin = {
    init: function (client, imports) {
        const emitter = new EventEmitter();

        function raw (line) {
            if (Array.isArray(line)) { line = line.join(" "); }
            client.info("->", String(line));
            client._socket.raw(line);
        }

        function rawf () {
            raw(format.apply(null, arguments));
        }


        function say (target, body) {
            if (Array.isArray(body)) {
                body.forEach(λ[say(target, #)]);
                return;
            }

            rawf("PRIVMSG %s :%s", target, body);
        }

        // CTCP Spec: https://web.archive.org/web/20080907101719/http://www.invlogic.com/irc/ctcp2_3.html
        function makeCtcpFn (responseFn) {
            return function ctcpRequest (target, tag, body) {
                if (Array.isArray(body)) {
                    body.forEach(λ[ctcpRequest(target, tag, #)]);
                    return;
                }

                tag = tag.toUpperCase();
                
                if (body) {
                    responseFn(target, format("\u0001%s %s\u0001", tag, body));
                } else {
                    responseFn(target, format("\u0001%s\u0001", tag));
                }
            }
        }

        var ctcpRequest = makeCtcpFn(say);
        var ctcpRespond = makeCtcpFn(notice);

        // Deprecated(4.2.x)
        function ctcp () {
            client.warn("PluginAction", "Action 'ctcp' is deprecated. Use 'ctcpRequest' or 'ctcpRespond' instead. Assuming usage is a request.");
            ctcpRequest.apply(null, arguments);
        }

        function act (target, body) {
            ctcpRequest(target, "ACTION", body);
        }

        function notice (target, body) {
            if (Array.isArray(body)) {
                body.forEach(λ[notice(target, #)]);
                return;
            }

            rawf("NOTICE %s :%s", target, body);
        }

        const join = require("./join")(client, rawf, emitter);
        const part = require("./part")(client, rawf, emitter);

        function kick (channel, nickname, reason) {
            if (reason) {
                rawf("KICK %s %s :%s", channel, nickname, reason);
            } else {
                rawf("KICK %s %s", channel, nickname);
            }
        }

        function nick (newNick) {
            rawf("NICK %s", newNick);
        }

        function quit (reason) {
            client.note(format("Quitting with reason: %s", reason));
            raw("QUIT" + (reason ? " :" + reason : ""));
        }

        function mode (target, plus, minus, inArgs) {
            var args = ":";

            if (plus) {
                args += "+" + plus;
            }

            if (minus) {
                args += "-" + minus;
            }

            if (inArgs) {
                args += " " + (Array.isArray(inArgs) ? inArgs.join(" ") : inArgs);
            }

            raw(["MODE", target, args]);
        }

        function userhost (users) {
            if (typeof users === "string") {
                rawf("USERHOST:%s", users);
            } else if (typeof users === "array") {
                chunk(users, 5)
                .map(function (hosts) { return hosts.join(" "); })
                .map(userhost);
            } else {
                throw new Error("Userhost command takes either a string (a single nick) or an array (of string nicks)");
            }
        }

        function who (channel) {
            raw(["WHO", channel]);
        }

        const whois = require("./whois")(client, rawf, emitter);

        /* To replace these functions...
        const part = require("./part")(client, action_plugin);
        const quit = require("./quit")(client, action_plugin);
        const nick = require("./nick")(client, action_plugin);
        const mode = require("./mode")(client, action_plugin);
        const userhost = require("./userhost")(client, action_plugin);
        const who = require("./who")(client, action_plugin);
        */

        return {
            exports: {
                emitter: emitter,

                raw: raw,
                rawf: rawf,
                
                say: say,

                // Deprecated(4.2.x)
                ctcp: ctcp,

                ctcpRequest: ctcpRequest,
                ctcpRespond: ctcpRespond,
                act: act,
                notice: notice,
                join: join,
                part: part,
                kick: kick,
                nick: nick,
                quit: quit,
                mode: mode,
                userhost: userhost,
                who: who,
                whois: whois
            },

            subscribe: {
                emitter: emitter,
                prefix: "action:"
            }
        };
    },

    requires: ["subscriber"]
};