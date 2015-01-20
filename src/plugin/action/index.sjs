/**
 * The OutputSocket is a facade for the IrcSocket's `raw` method.
 *
 * 
 * It supports the following methods:
 *
 * Public Methods
 *
 * act;
 * ctcp;
 * join;
 * mode;
 * nick;
 * notice;
 * part;
 * quit;
 * say;
 * userhost;
 * who;
 * whois;
 * raw;
 * rawf;
 */

const inspect = require('util').inspect;
const format = require('util').format;
const chunk = require('chunk');
const Promise = require('bluebird');

module.exports = ActionPlugin = {
    init: function (client, imports) {
        function raw (line) {
            if (Array.isArray(line)) { line = line.join(" "); }
            client.info("->: " + String(line));
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

        function ctcp (target, type, body) {
            if (Array.isArray(body)) {
                body.forEach(λ[ctcp(target, type, #)]);
                return;
            }
            
            say(target, format('\u0001%s %s\u0001', type, body));
        }

        function act (target, body) {
            ctcp(target, "ACTION", body);
        }

        function notice (target, body) {
            rawf("NOTICE %s :%s", target, body);
        }

        function join (channel) {
            return new Promise(function (resolve, reject) {
                var unsubscribe = function () {
                    logger.debug("Join response or timeout occured.");
                    client.off('join', onJoin);
                };

                var onJoin = function (join) {
                    if (join.nickname !== nickname() || join.channel !== channel) {
                        return;
                    }

                    unsubscribe();
                    logger.debug("Resolving with join body.");
                    resolve(join);
                };

                client.on('join', onJoin);

                rawf("JOIN :%s", channel);
            });
        }


        function part (channel, reason) {
            raw("PART " + channel + (reason ? " :" + reason: ""));
        }

        function nick (newNick) {
            rawf("NICK %s", newNick);
        }

        function quit (reason) {
            client.note(format("Quitting with reason: %s", reason));
            raw("QUIT" + (reason ? " :" + reason : ""));
        }

        function mode (target, plus, minus, inArgs) {
            var args = " :";

            if (plus) {
                args += "+" + plus;
            }

            if (minus) {
                args += "-" + minus;
            }

            if (inArgs) {
                args += " " + util.isArray(inArgs) ? inArgs.join(' ') : inArgs;
            }

            raw(["MODE", target, args]);
        }

        function userhost (users) {
            if (typeof users === 'string') {
                rawf("USERHOST:%s", users);
            } else if (typeof users === 'array') {
                chunk(users, 5)
                .map(function (hosts) { return hosts.join(' '); })
                .map(userhost);
            } else {
                throw new Error("Userhost command takes either a string (a single nick) or an array (of string nicks)");
            }
        }

        function who (channel) {
            raw(["WHO", channel]);
        }

        function whois (users, server) {
            if (typeof users === "array") {
                if (users.length > 15) {
                    chunk(users, 15)
                    .map(function (users) { return users.join(','); })
                    .map(function (users) { whois(users, server); });
                }
            } else if (typeof users === 'string') {
                raw("WHOIS " + (server ? server + " " : "") + users);
            } else {
                throw new Error("Whois command takes either a string (a single nick) or an array (of string nicks)");
            }
        }

        /* To replace these functions...
        const join = require('./join')(client, action_plugin);
        const part = require('./part')(client, action_plugin);
        const quit = require('./quit')(client, action_plugin);
        const nick = require('./nick')(client, action_plugin);
        const mode = require('./mode')(client, action_plugin);
        const userhost = require('./userhost')(client, action_plugin);
        const whois = require('./whois)(client, action_plugin);
        const who = require('./who')(client, action_plugin);
        */

        return {
            exports: {
                raw: raw,
                rawf: rawf,
                say: say,
                ctcp: ctcp,
                act: act,
                notice: notice,
                join: join,
                part: part,
                nick: nick,
                quit: quit,
                mode: mode,
                userhost: userhost,
                who: who,
                whois: whois
            }
        };
    }//,

    //requires: "server";
};