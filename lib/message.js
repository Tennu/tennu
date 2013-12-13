var RFCMessage = require('irc-message');
var mircColors = /\u0003\d?\d?,?\d?\d?/g;

var extensions = {
    join: function (message) {
        message.actor = message.sender.nickname;
        message.channel = message.params[0].toLowerCase();
    },

    part: function (message) {
        message.actor = message.sender.nickname;
        message.channel = message.params[0].toLowerCase();
    },

    privmsg: function (message) {
        message.actor = message.sender.nickname;

        // Test fails if new channel prefixes are created by IRCds, but that's unlikely.
        if ("#!+.~".indexOf(message.params[0][0]) === -1) {
            message.isQuery = true;
            message.channel = message.actor;
        } else {
            message.isQuery = false;
            message.channel = message.params[0];
        }

        message.message = message.params[1].trim().replace(mircColors, "");
    },

    notice: function (message) {
        message.actor = message.sender.nickname;
        message.receiverNickname = message.params[0];
        message.message = message.params[1].trim().replace(mircColors, "");
    },

    quit: function (message) {
        message.actor = message.sender.nickname;
        message.reason = message.params[0];
    },

    nick: function (message) {
        message.actor = message.sender.nickname;
        message.old = message.sender.nickname;
        message.new = message.params[0];
    },
};

var Message = function (raw, receiver) {
    var message = Object.create(new RFCMessage(raw));

    message.receiver = receiver;
    message.command = message.command.toLowerCase();

    if (message.prefixIsHostmask()) {
        message.sender = message.parseHostmaskFromPrefix();
    }

    if (extensions[message.command]) {
        extensions[message.command](message);
    }

    return message;
};

module.exports = Message;