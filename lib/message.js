var RFCMessage = require('irc-message');
var mircColors = /\u0003\d?\d?,?\d?\d?/g;
var util = require('util');

var extensions = {
    join: function (message) {
        message.channel = message.params[0].toLowerCase();
    },

    part: function (message) {
        message.channel = message.params[0].toLowerCase();
        message.reason = message.params[1];
    },

    kick: function (message) {
        message.channel = message.params[0].toLowerCase();
        message.kicked = message.params[1];
        message.kicker = message.params[2];
    },

    quit: function (message) {
        message.reason = message.params[0];
    },

    privmsg: function (message) {
        // Test fails if new channel prefixes are created by IRCds, but that's unlikely.
        message.isQuery = ('#!+.~'.indexOf(message.params[0][0]) === -1);
        message.message = message.params[1].trim().replace(mircColors, '');

        if (message.isQuery) {
            message.channel = message.nickname;
        } else {
            message.channel = message.params[0];
        }
    },

    notice: function (message) {
        // Test fails if new channel prefixes are created by IRCds, but that's unlikely.
        message.isQuery = ('#!+.~'.indexOf(message.params[0][0]) === -1);
        message.message = message.params[1].replace(mircColors, '').trim();

        if (message.isQuery) {
            message.channel = message.nickname;
        } else {
            message.channel = message.params[0];
        }
    },

    nick: function (message) {
        message.old = message.hostmask.nickname;
        message.new = message.params[0];
    },

    '307': function (message) {
        // :<server> 307 <me> <nick> :is a registered nick
        // FIXME: Only accounts for Unrealircd
        message.replyname = 'RPL_WHOISREGNICK';
        message.nickname = message.params[1];
    },

    '311': function (message) {
        // :<server> 311 <me> <nick> <username> <hostmask> * <realname>
        message.replyname = 'RPL_WHOISUSER';
        message.nickname = message.params[1];
        message.username = message.params[2];
        message.hostname = message.params[3];
        message.realname = message.params[5];
        message.hostmask = {
            nickname: message.params[1],
            username: message.params[2],
            hostname: message.params[3]
        };
    },

    '312': function (message) {
        // :<server> 312 <me> <nick> <server> :<info>
        message.replyname= 'RPL_WHOISSERVER';
        message.nickname = message.params[1];
        message.server = message.params[2];
        message.serverInfo = message.params[3];
    },

    '317': function (message) {
        // :<server> 317 <me> <nick> <seconds> <unixtime> :seconds idle, signon time
        message.replyname = 'RPL_WHOISIDLE';
        message.nickname = message.params[1];
        message.seconds = message.params[2];
        message.since = message.params[3];
    },

    '318': function (message) {
        // :<server> 318 <me> <nick> :End of /WHOIS list.
        message.replyname = 'RPL_ENDOFWHOIS';
        message.nickname = message.params[1];
    },

    '319': function (message) {
        // :<server> 319 <me> <nickname> :<channels>
        // channel format:  <power sigil>?<channel sigil><name>
        message.replyname = 'RPL_WHOISCHANNELS';
        message.nickname = message.params[1];
    },

    '330': function (message) {
        // :<server> 330 <me> <nickname> <ident> :is logged in as
        // Nonstandard, but used on most IRCds.
        message.replyname = 'RPL_WHOISLOGGEDIN';
        message.nickname = message.params[1];
        message.identifiedas = message.params[2];
    },

    '332': function (message) {
        // :<server> 332 <me> <channel> :<topic>
        message.replyname = 'RPL_TOPIC';
        message.chanenl = message.params[1];
        message.topic = message.params[2];
    },

    '333': function (message) {
        // :<server> 333 <me> <channel> <who> <timestamp>
        message.replyname = 'RPL_TOPICWHOTIME';
        message.channel = message.params[1];
        message.who = message.params[2];
        message.timestamp = message.params[3];
    },

    '353': function (message) {
        // :<server> 353 <me> = <channel> :<nicknames>
        message.replyname = 'RPL_NAMREPLY';
        message.channel = message.params[2];
        message.nicknames = message.params[3].split(' ');
    },

    '366': function (message) {
        // :<server> 366 <me> <channel> :End of /NAMES list.
        message.replyname = 'RPL_ENDOFNAMES';
        message.channel = message.params[1];
    },

    '378': function (message) {
        // :<server> 378 <me> <nickname> :is connecting from <hostmask> <ip>
        message.replyname = 'RPL_WHOISHOST';
        message.nickname = message.params[1];
        var words = message.params[2].split(' ');
        message.hostmask = words[3];
        message.ip = words[4];
    },

    '401': function (message) {
        // :<server> 401 <me> <nick> :No such nick/channel
        message.replyname= 'ERR_NOSUCHNICK';
        message.nickname = message.params[1];
    },

    '403': function (message) {
        // :<server> 403 <me> <channel> :<reason>
        message.replyname = 'ERR_NOSUCHCHANNEL';
        message.channel = message.params[1];
    },

    '405': function (message) {
        // :<server> 405 <me> <channel> :<reason>
        message.replyname = 'ERR_TOOMANYCHANNELS';
        message.channel = message.params[1];
    },

    '671': function (message) {
        // :<server> 671 <me> <nickname> :is using a secure connection
        message.replyname = 'RPL_WHOISSECURE'
    }
};

var Message = function (raw) {
    var message = Object.create(new RFCMessage(raw));

    message.command = message.command.toLowerCase();

    // message.hostmask is either null or an object with
    // nickname, username, hostname properties.
    message.hostmask = message.parseHostmaskFromPrefix();
    message.nickname = message.hostmask && message.hostmask.nickname;

    if (extensions[message.command]) {
        extensions[message.command](message);
    }

    return message;
};

Message.extensions = extensions;

module.exports = Message;