var SSet = require("simplesets").Set;

var users = {};

var User = function (name, channel) {
    this.name = name;
    this.channels = new SSet([channel]);
};

var addUserChannel = function (user, channel) {
    if (users[user]) {
        users[user].channels.add(channel);
    } else {
        users[user] = new User(user, channel);
    }
};

var removeUserChannel = function (user, channel) {
    users[user].channels.remove(channel);
};

var isSelf = function (nrc, nick) {
    return nrc.nick() === nick;
};

var selfPart = function (channel) {
    users.forEach(function (user) {
        removeUserChannel(user, channel);
    });
};

var userQuit = function (user) {
    // Clean out the channels list of the user.
    while (users[user].channels.pop() !== null);
};

/**
 * Responds to the 353 raw numeric, which is sent when joining a channel.
 * The Message object handles adding users and channel automatically, so
 * there really isn't any work that has to be done here other than actually
 * adding the channels to the users.
 */
var namesHandler = function (msg) {
    msg.users.forEach(function (user) {
        addUserChannel(user, msg.channel);
    });
};

var onLeave = function () {
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

var onNick = function (msg) {
    users[msg.newNick] = users[msg.actor];
    delete users[msg.actor];
};

module.exports = {
    name: "users",
    exports: {
        users : users
    },
    handlers: {
        "join part quit" : onLeave,
        "nick" : onNick,
        "353" : namesHandler
    }
};