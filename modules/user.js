// XXX: Make sure to fix all the broken names to use `this`
// This is because before, this module had a global called users.
// But that doesn't scale to multiple NRC connections.

var util = require('util');

var SSet = require("simplesets").Set;
var server;

var filterStatusSymbol = function (nickname) {
    // We have bigger problems if server isn't there...
    if (server && server.capabilities && server.capabilities.STATUSMSG) {
        if (server.capabilities.STATUSMSG.indexOf(nickname[0]) !== -1) {
            return nickname.substring(1);
        }
    }

    return nickname;
};

var isSelf = function (nrc, nick) {
    return nrc.nick() === nick;
};

var User = function (name, channel) {
    this.name = name;
    this.channels = new SSet([channel]);
};

/**
 * Fields
 *   _server
 */
var UserModule = function (nrc) {
    this._nrc = nrc;
    this._server = null;
    this.users = {};
};

// Keep the actual Module seperate from the UserModule class. If the
// interface changes in the future, we are prepared!
UserModule.prototype.getModule = function () {
    return {
        name: "users",
        exports: {
            users : this.users
        },
        handlers: {
            "load" : this.onLoad.bind(this),
            "join part quit" : this.onLeave.bind(this),
            "nick" : this.onNick.bind(this),
            "353" : this.namesHandler.bind(this)
        }
    };
};

UserModule.prototype.onLoad =  function () {
    // Should be a dependency...
    this._server = this._nrc.use("server");
};

/**
 * Responds to the 353 raw numeric, which is sent when joining a channel.
 * The Message object handles adding users and channel automatically, so
 * there really isn't any work that has to be done here other than actually
 * adding the channels to the users.
 */
UserModule.prototype.namesHandler = function (msg) {
    msg.users.forEach(function (user) {
        // The numeric will add status messages (~, @, ect.) to nicks.
        user = filterStatusSymbol(user);

        addUserChannel(user, msg.channel);
    });
};

UserModule.prototype.onLeave = function () {
    var self = {
        part: selfPart,
        quit: function () {},
        join: function () {}
    };

    var user = {
        part: removeUserChannel,
        quit: userQuit,
        join: addUserChannel
    };

    return function (msg) {
        if (isSelf(this, msg.actor)) {
            self[msg.type](msg.channel);
        } else {
            user[msg.type](msg.actor, msg.channel);
        }
    };
}();

UserModule.prototype.onNick = function (msg) {
    users[msg.newNick] = users[msg.actor];
    users[msg.newNick].name = msg.newNick;
    delete users[msg.actor];
};

UserModule.prototype._addUserChannel = function (user, channel) {
    if (users[user]) {
        users[user].channels.add(channel);
    } else {
        users[user] = new User(user, channel);
    }
};

UserModule.prototype._removeUserChannel = function (user, channel) {
    users[user].channels.remove(channel);
};

UserModule.prototype._selfPart = function (channel) {
    for (var user in users) {
        if (Object.hasOwnProperty(users, user)) {
            removeUserChannel(user, channel);
        }
    }
};

UserModule.prototype._userQuit = function (user) {
    // Clean out the channels list of the user.
    while (users[user].channels.pop() !== null);
};

module.exports = function (nrc) {
    return new UserModule(nrc).getModule();
};