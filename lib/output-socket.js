/**
 * The OutputSocket is a facade for the IrcSocket's `raw` method.
 *
 * Though it doesn't have all commands possible, it has
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
 */

/*
The fact that the output socket keeps track of the user's nick is both wrong
and stupid, and needs another refactoring to move out.
This will be fixed in 0.8.x.
*/

var util = require('util');
var format = util.format;

var partition = function (array, length) {
    var partitions = [];
    for (var i = 0, len = array.length; i < len; i += length) {
        partitions.push(array.slice(i, i + length));
    }
    return partitions;
};

var OutputSocket = function (socket, logger, nick) {
    var raw = function (line) {
        if (Array.isArray(line)) { line = line.join(" "); }
        logger.info("->: " + String(line));
        socket.raw(line);
    };

    var rawf = function () {
        raw(format.apply(null, arguments));
    };

    return {
        say : function recur (location, message) {
            if (util.isArray(message)) {
                message.forEach(function (msg) {
                    recur.call(this, location, msg);
                });

                return;
            }
            rawf("PRIVMSG %s :%s", location, message);
        },

        ctcp : function recur (location, type, message) {
            if (util.isArray(message)) {
                message.forEach(function (msg) {
                    recur.call(this, location, type, msg);
                });

                return;
            }
            this.say(location, format('\u0001%s %s\u0001', type, message));
        },

        act: function (location, message) {
            this.ctcp(location, "ACTION", message);
        },

        join : function (channel) {
            rawf("JOIN :%s", channel);
        },

        part : function (channel, reason) {
            raw("PART " + channel + (reason ? " :" + reason : ""));
        },

        nick : function (newNick) {
            if (newNick) {
                rawf("NICK %s", newNick);
                nick = newNick;
                return;
            } else {
                return nick;
            }
        },

        quit : function (reason) {
            logger.notice(format("Quitting with reason: %s", reason));
            raw("QUIT" + (reason ? " :" + reason : ""));
        },

        mode : function (target, plus, minus, inArgs) {
            var args = ":";

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

        userhost : function recur (users) {
            if (typeof users === 'string') {
                rawf("USERHOST :%s", users);
            } else if (typeof users === 'array') {
                partition(users, 5)
                .map(function (hosts) { return hosts.join(' '); })
                .map(recur);
            } else {
                throw new Error("Userhost command takes either a string (a single nick) or an array (of string nicks)");
            }
        },

        whois : function recur (users, server) {
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

        _raw : raw,
        _rawf : rawf,
        toString : function () { return "[Object IrcOutputSocket]"; }
    };
};

module.exports = OutputSocket;