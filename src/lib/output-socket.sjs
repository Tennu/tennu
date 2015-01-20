/**
 * The OutputSocket is a facade for the IrcSocket's `raw` method.
 *
 * This could really be in tennu_modules, except that it is integrated
 * into the client. It will be soon enough. First though, upgrade the modules.
 * 
 * It supports the following methods:
 *
 * Public Methods
 *   say
 *   act
 *   join
 *   part
 *   quit
 *   nick
 *   mode
 *   userhost
 *   whois
 *   raw
 *   rawf
 */

var inspect = require('util').inspect;
var format = require('util').format;
var Promise = require('bluebird');

var partition = function (array, length) {
    var partitions = [];
    for (var i = 0, len = array.length; i < len; i += length) {
        partitions.push(array.slice(i, i + length));
    }
    return partitions;
};

var OutputSocket = function (socket, messageHandler, nickname, logger) {
    var raw = function (line) {
        if (Array.isArray(line)) { line = line.join(" "); }
        logger.info("->: " + String(line));
        socket.raw(line);
    };

    var rawf = function () {
        raw(format.apply(null, arguments));
    };

    return {
        say: function recur (target, message) {
            if (Array.isArray(message)) {
                message.forEach(function (msg) {
                    recur.call(this, target, msg);
                });

                return;
            }
            rawf("PRIVMSG %s :%s", target, message);
        },

        ctcp: function recur (target, type, message) {
            if (Array.isArray(message)) {
                message.forEach(function (msg) {
                    recur.call(this, target, type, msg);
                });

                return;
            }
            this.say(target, format('\u0001%s %s\u0001', type, message));
        },

        act: function (target, message) {
            this.ctcp(target, "ACTION", message);
        },

        notice: function recur (target, message) {
            if (Array.isArray(message)) {
                message.forEach(function (msg) {
                    recur.call(this, target, msg);
                });

                return;
            }
            rawf("NOTICE %s :%s", target, message);
        },

        join: function (channel) {
            return new Promise(function (resolve, reject) {
                var unsubscribe = function () {
                    logger.debug("Join response or timeout occured.");
                    messageHandler.off('join', onJoin);
                };

                var onJoin = function (join) {
                    if (join.nickname !== nickname() || join.channel !== channel) {
                        return;
                    }

                    unsubscribe();
                    logger.debug("Resolving with join message.");
                    resolve(join);
                };

                messageHandler.on('join', onJoin);

                rawf("JOIN :%s", channel);
            });
        },

        part: function (channel, reason) {
            raw("PART " + channel + (reason ? " :" + reason: ""));
        },

        nick: function (newNick) {
            rawf("NICK %s", newNick);
        },

        quit: function (reason) {
            logger.notice(format("Quitting with reason: %s", reason));
            raw("QUIT" + (reason ? " :" + reason : ""));
        },

        mode: function (target, plus, minus, inArgs) {
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
        },

        userhost: function recur (users) {
            if (typeof users === 'string') {
                rawf("USERHOST: %s", users);
            } else if (typeof users === 'array') {
                partition(users, 5)
                .map(function (hosts) { return hosts.join(' '); })
                .map(recur);
            } else {
                throw new Error("Userhost command takes either a string (a single nick) or an array (of string nicks)");
            }
        },

        whois: function recur (users, server) {
            if (typeof users === "array") {
                if (users.length > 15) {
                    partition(users, 15)
                    .map(function (users) { return users.join(','); })
                    .map(function (users) { recur(users, server); });
                }
            } else if (typeof users === 'string') {
                raw("WHOIS " + (server ? server + " " : "") + users);
            } else {
                throw new Error("Whois command takes either a string (a single nick) or an array (of string nicks)");
            }
        },

        who: function (channel) {
            raw(["WHO", channel]);
        },

        raw: raw,
        rawf: rawf,
        toString: function () { return "[Object IrcOutputSocket]"; }
    };
};

module.exports = OutputSocket;
