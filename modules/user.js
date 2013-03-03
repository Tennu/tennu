var util = require('util');

var SSet = require("simplesets").Set;
var server;

var isSelf = function (nrc, nick) {
    return nrc.nick() === nick;
};

var User = function (name, channel) {
    this.name = name;
    this.channels = new SSet([channel]);
};

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
        user = this._stripStatusSymbol(user);

        addUserChannel(user, msg.channel);
    });
};

UserModule.prototype.onLeave = function () {
    var self = {
        part: this._selfPart,
        quit: function () {},
        join: function () {}
    };

    var user = {
        part: this._removeUserChannel,
        quit: this._userQuit,
        join: this._addUserChannel
    };

    return function (msg) {
        if (isSelf(this, msg.actor)) {
            self[msg.type].call(this, msg.channel);
        } else {
            user[msg.type].call(this, msg.actor, msg.channel);
        }
    };
}();

UserModule.prototype.onNick = function (msg) {
    this.users[msg.newNick] = this.users[msg.actor];
    this.users[msg.newNick].name = msg.newNick;
    delete this.users[msg.actor];
};

UserModule.prototype._addUserChannel = function (user, channel) {
    if (this.users[user]) {
        this.users[user].channels.add(channel);
    } else {
        this.users[user] = new User(user, channel);
    }
};

UserModule.prototype._removeUserChannel = function (user, channel) {
    this.users[user].channels.remove(channel);
};

UserModule.prototype._selfPart = function (channel) {
    for (var user in users) {
        if (Object.hasOwnProperty(users, user)) {
            this._removeUserChannel(user, channel);
        }
    }
};

UserModule.prototype._userQuit = function (user) {
    // Clean out the channels list of the user.
    while (this.users[user].channels.pop() !== null);
};

// If the username starts with a mode character (such as @, strip it)
UserModule.prototype._stripStatusSymbol = function (nickname) {
    // We have bigger problems if server isn't there...
    if (this._server && this._server.capabilities &&
        this._server.capabilities.STATUSMSG)
    {
        if (this._server.capabilities.STATUSMSG.indexOf(nickname[0]) !== -1) {
            return nickname.substring(1);
        }
    }

    return nickname;
};

module.exports = function (nrc) {
    return new UserModule(nrc).getModule();
};