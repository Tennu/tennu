/**
 * The OutputSocket is a facade for the IrcSocket's `raw` method.
 *
 * Though it doesn't have all commands possible, it hsa
 *
 * Public Methods
 *   say
 *   act
 *   join
 *   part
 *   quit
 *   nick
 *   userhost
 *   whois
 */

/*
The fact that the output socket keeps track of the user's nick is both wrong
and stupid, and needs another refactoring to move out.
*/

var util = require('util');

// Calls fn for each element in the array of the second parameter.
// If no array, treat as an array of one element. ;)
var invokeGroupTwo = function (fn) {
    return function (_, group) {
        if (util.isArray(group)) {
            var args = Array.prototype.slice.call(arguments);
            for (var ix = 0; ix < group.length; ix++) {
                args[1] = group[ix];
                fn.apply(this, args);
            }
        } else {
            fn.apply(this, arguments);
        }
    };
};

var OutputSocket = function (socket, nick) {
    this._socket = socket;
    this._nick = nick;
};

OutputSocket.prototype.say = invokeGroupTwo(function (location, message) {
    this._raw(["PRIVMSG", location, ":" + message].join(" "));
});

OutputSocket.prototype.ctcp = invokeGroupTwo(function (location, message) {
    this.say(location, '\u0001' + message + '\u0001');
});

OutputSocket.prototype.act = invokeGroupTwo(function (location, message) {
    this.ctcp(location, "ACTION " + message);
});

OutputSocket.prototype.join = function (channel) {
    this._raw(["JOIN", channel]);
};

OutputSocket.prototype.part = function (channel, reason) {
    this._raw("PART "+ channel + (reason ? " :" + reason : ''));
};

OutputSocket.prototype.nick = function (newNick) {
    if (newNick) {
        this._raw("NICK " + newNick);
        this._nick = newNick;
        return;
    } else {
        return this._nick;
    }
};

OutputSocket.prototype.quit = function (reason) {
    this._raw("QUIT" + (reason ? " :" + reason : ""));
};

OutputSocket.prototype.userhost = function (users) {
    switch (typeof users) {
        case "string":
            this._raw("USERHOST " + users);
            break;
        case "array":
            while (users.length !== 0) {
                this.userhost(users.splice(0, 5).join(' '));
            }
        break;
            default:
            throw new Error("Userhost command takes either a string (a" +
                " single nick) or an array (of string nicks)");
    }
};

OutputSocket.prototype.whois = function (users, server) {
    if (typeof users === "array") {
        while (users.length > 15) {
            this.whois(users.splice(0, 15), server);
        }

        users = users.join(',');
    }

    this._raw("WHOIS " + server ? server + " " : "" + users);
};

OutputSocket.prototype._raw = function (command) {
    this._socket.raw(command);
};

module.exports = OutputSocket;