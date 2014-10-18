/**
 * The OutputSocket is a facade for the IrcSocket's `raw` method.
 *
 * This could really be in tennu_modules, except that it is integrated
 * into the client.
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

/*
var inspect = require('util').inspect;
var format = require('util').format;
var Q = require('q');

function unary (fn) {
    return function (arg) {
        return fn(arg);
    };
}

function autoliftEach (fn, arg) {
    Array.isArray(arg) ? arg.forEach(unary(fn)) : fn(arg);
}

function autoliftEachSecondArg (fn) {
    return function (first, second) {
        return autoliftEach(fn.bind(null, first);
    };
}

var partition = function (array, length) {
    const partitions = [];
    for (var i = 0, len = array.length; i < len; i += length) {
        partitions.push(array.slice(i, i + length));
    }
    return partitions;
};

var ActionModule = function (client) {
    var socket = client._socket;

    function raw (line) {
        if (Array.isArray(line)) { line = line.join(" "); }
        logger.info("->: " + String(line));
        socket.raw(line);
    }

    function rawf () {
        raw(format.apply(null, arguments));
    }

    function say (target, message) {
        rawf("PRIVMSG %s :%s", target, message);
    }

    function ctcp (target, type, message) {
        say(target, format('\u0001%s %s\u0001', type, message));
    }

    function act (target, action) {
        ctcp(target, "ACTION", action);
    }

    const join = require('./join.js')(client, action_module);
    const part = require('./part.js')(client, action_module);
    const quit = require('./quit.js')(client, action_module);
    const nick = require('./nick.js')(client, action_module);
    const mode = require('./mode.js')(client, action_module);
    const userhost = require('./userhost.js')(client, action_module);
    const whois = require('./whois.js')(client, action_module);

    var action_module = {
        dependencies: ['server'],
        exports: {
            raw: raw,
            rawf: rawf,
            say: autoliftEachSecondArg(say),
            ctcp: autoliftEachSecondArg(say),
            act: autoliftEachSecondArg(act),
            join: join,
            part: part,
            nick: nick,
            quit: quit,
            mode: mode,
            userhost: userhost,
            whois: whois
        }
    };
};

module.exports = action_module;

/*
var OutputSocket = function (socket, messageHandler, nickname, logger) {


    return {

        part : function (channel, reason) {
            raw("PART " + channel + (reason ? " :" + reason : ""));
        },

        nick : function (newNick) {
            rawf("NICK %s", newNick);
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
        }
    };
};

*/