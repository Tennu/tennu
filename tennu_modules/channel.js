/*

var SSet = require("simplesets").Set;

var isSelf = function (nrc, nick) {
    return nrc.getNick() === nick;
};

var channels = {};

var Channel = function (name) {
    this.name = name;
    this.users = new SSet();
};

Channel.prototype.addUser = function (user) {
    this.users.add(user);
};

Channel.prototype.removeUser = function (user) {
    this.users.remove(user);
};

var removeUserChannel = function (user) {
    channels[channel].removeUser(user);
};

var selfPart = function (channel) {
    channels[channel];
};

var selfJoin = function (channel) {
    channels[channel] = new Channel(channel);
};

/**
 * Responds to the 353 raw numeric, which is sent when joining a channel.
 * The Message object handles adding users and channel automatically, so
 * there really isn't any work that has to be done here other than actually
 * adding the channels to the users.
 *//*
var namesHandler = function (msg) {
    msg.users.forEach(function (user) {
        addChannelToUser(msg.channel, user);
    });
};

var onleave = function () {
    var self = {
        part: selfPart,
        quit: function () {},
        join: selfJoin
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

var onNick = function (msg) {
    channels.forEach(function (channel) {
        if (channel.users.has(msg.actor)) {
            channel.users.remove(msg.actor);
            channel.users.add(msg.newNick);
        }
    });
};

module.exports = {
    name: "users",
    exports: {
        users:users
    },
    handlers: {
        "join part quit" : onLeave,
        "nick" : onNick,
        "353" : namesHandler
    }
};

*/

module.exports = function (tennu) {
    return {};
};