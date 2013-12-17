var RFCMessage = require('irc-message');
var mircColors = /\u0003\d?\d?,?\d?\d?/g;
var util = require('util');

var extensions = {
    join: function (message) {
        message.channel = message.params[0].toLowerCase();
    },

    part: function (message) {
        message.channel = message.params[0].toLowerCase();
    },

    privmsg: function (message) {
        // Test fails if new channel prefixes are created by IRCds, but that's unlikely.
        message.isQuery = ("#!+.~".indexOf(message.params[0][0]) === -1);
        message.message = message.params[1].trim().replace(mircColors, "");

        if (message.isQuery) {
            message.channel = message.nickname;
        } else {
            message.channel = message.params[0];
        }
    },

    notice: function (message) {
        // Test fails if new channel prefixes are created by IRCds, but that's unlikely.
        message.isQuery = ("#!+.~".indexOf(message.params[0][0]) === -1);
        message.message = message.params[1].trim().replace(mircColors, "");

        if (message.isQuery) {
            message.channel = message.nickname;
        } else {
            message.channel = message.params[0];
        }
    },

    quit: function (message) {
        message.reason = message.params[0];
    },

    nick: function (message) {
        message.old = message.hostmask.nickname;
        message.new = message.params[0];
    },
};

var Message = function (raw, receiver) {
    var message = Object.create(new RFCMessage(raw));

    message.receiver = receiver;
    message.command = message.command.toLowerCase();

    if (message.prefixIsHostmask()) {
        message.hostmask = message.parseHostmaskFromPrefix();
        message.nickname = message.hostmask.nickname;
    }

    if (extensions[message.command]) {
        extensions[message.command](message);
    }

    return message;
};

module.exports = Message;