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
*/

var util = require('util');

var partition = function (array, length) {
    var partitions = [];
    for (var i = 0, len = array.length; i < len; i += length) {
        partitions.push(array.slice(i, i + length));
    }
    return partitions;
};

var OutputSocket = function (socket, nick) {
    var raw = socket.raw.bind(socket);

    return {
        say : function say (location, message) {
            if (util.isArray(message)) {
                message.forEach(function (msg) {
                    say.call(this, location, msg);
                });

                return;
            }
            raw(["PRIVMSG", location, ":" + message].join(" "));
        },

        ctcp : function ctcp (location, type, message) {
            if (util.isArray(message)) {
                message.forEach(function (msg) {
                    ctcp.call(this, location, type, msg);
                });

                return;
            }
            this.say(location, '\u0001' + type + " " + message + '\u0001');
        },

        act: function act (location, message) {
            this.ctcp(location, "ACTION", message);
        },

        join : function (channel) {
            raw(["JOIN", channel]);
        },

        part : function (channel, reason) {
            raw("PART "+ channel + (reason ? " :" + reason : ''));
        },

        nick : function (newNick) {
            if (newNick) {
                raw("NICK " + newNick);
                nick = newNick;
                return;
            } else {
                return nick;
            }
        },

        quit : function (reason) {
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

        userhost : function userhost (users) {
            if (typeof users === 'string') {
                raw("USERHOST " + users);
            } else if (typeof users === 'array') {
                partition(users, 5)
                .map(function (hosts) { return hosts.join(' '); })
                .map(userhost);
            } else {
                throw new Error("Userhost command takes either a string (a" +
                    " single nick) or an array (of string nicks)");
            }
        },

        whois : function whois (users, server) {
            if (typeof users === "array") {
                if (users.length > 15) {
                    partition(users, 15)
                    .map(function (users) { return users.join(','); })
                    .map(function (users) { whois(users, server); });
                }
            } else if (typeof users === 'string') {
                raw("WHOIS " + server ? server + " " : "" + users);
            } else {
                throw new Error("Whois command takes either a string (a" +
                    " single nick) or an array (of string nicks)");
            }
        },

        _raw : raw,
        toString : require('./make-toString')('OutputSocket')
    };
};

module.exports = OutputSocket;