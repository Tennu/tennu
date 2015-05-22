var RFCMessage = require("irc-message");
var mircColors = /\u0003\d?\d?,?\d?\d?/g;
var util = require("util");

// Note(Havvy): All numerics are listed at https://www.alien.net.au/irc/irc2numerics.html
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
        message.message = message.params[1].replace(mircColors, "").trim();

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

    mode: function (message) {
        message.channel = message.params[0]; // Channel or nick
        message.modestring = message.params[1]; // +asd-asdaf
        // The IRCd should only send the modestring with the argument modes last.
        // i.e "+soh nick nick" or "+s-zh+o nick nick" or "+pzh-o nick nick"
        message.modes = [];
        var args = message.params.slice(2);
        var modes = message.modestring.split("");
        var prefixes = {"+":true,"-":false};
        var argModes = { // TODO: Use the "CHANMODES" sent by the server on connect to make this dict
            "a": "nick",
            "b": "mask",
            "e": "mask",
            "f": "lines:second",
            "h": "nick",
            "I": "mask",
            "J": "joins:second",
            "k": "key",
            "l": "max_users",
            "L": "channel",
            "o": "nick",
            "O": "nick",
            "q": "nick",
            "v": "nick"
        };
        for (var i = 0, set_mode = true; i < modes.length; i++) {
            var mode = modes[i];
            if (mode in prefixes) {
                set_mode = prefixes[mode];
            } else if (mode in argModes) {
                message.modes.push({
                    mode: mode,
                    parameter: args.shift(),
                    set: set_mode
                });
            } else {
                message.modes.push({
                    mode: mode,
                    set: set_mode
                });
            }
        }
    },

    "001": function (message) {
        message.replyname = "RPL_WELCOME";
    },

    "307": function (message) {
        // :<server> 307 <me> <nick> :is a registered nick
        // FIXME(Havvy): Only accounts for UnrealIRCd
        message.replyname = "RPL_WHOISREGNICK";
        message.nickname = message.params[1];
    },

    "310": function (message) {
        // :<server> 310 <me> <nick> :is available for help.
        // FIXME(Havvy): Bahumat & AustHex use this numeric for other purposes.
        
        // UnrealIRCd Only
        message.replyname = "RPL_WHOISHELPOP";
    },

    "311": function (message) {
        // :<server> 311 <me> <nick> <username> <hostmask> * <realname>
        message.replyname = "RPL_WHOISUSER";
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

    "312": function (message) {
        // :<server> 312 <me> <nick> <server> :<info>
        message.replyname = "RPL_WHOISSERVER";
        message.nickname = message.params[1];
        message.server = message.params[2];
        message.serverInfo = message.params[3];
    },

    "313": function (message) {
        // :<server> 313 <me> <nickname> :is a Network Administrator
        message.replyname = "RPL_WHOISOPERATOR";
        message.nickname = message.params[1];
        message.permissions = message.params[2];
    },

    "317": function (message) {
        // :<server> 317 <me> <nick> <seconds> <unixtime> :seconds idle, signon time
        message.replyname = "RPL_WHOISIDLE";
        message.nickname = message.params[1];
        message.seconds = message.params[2];
        message.since = message.params[3];
    },

    "318": function (message) {
        // :<server> 318 <me> <nick> :End of /WHOIS list.
        message.replyname = "RPL_ENDOFWHOIS";
        message.nickname = message.params[1];
    },

    "319": function (message) {
        // :<server> 319 <me> <nickname> :<channels>
        // channel format:  <power sigil>?<channel sigil><name>
        message.replyname = "RPL_WHOISCHANNELS";
        message.nickname = message.params[1];
        message.channels = message.params[2].toLowerCase();
    },

    "330": function (message) {
        // :<server> 330 <me> <nickname> <ident> :is logged in as
        // Nonstandard, but used on most IRCds.
        message.replyname = "RPL_WHOISLOGGEDIN";
        message.nickname = message.params[1];
        message.identifiedas = message.params[2];
    },

    "332": function (message) {
        // :<server> 332 <me> <channel> :<topic>
        message.replyname = "RPL_TOPIC";
        message.channel = message.params[1].toLowerCase();
        message.topic = message.params[2];
    },

    "333": function (message) {
        // :<server> 333 <me> <channel> <who> <timestamp>
        message.replyname = "RPL_TOPICWHOTIME";
        message.channel = message.params[1].toLowerCase();
        message.who = message.params[2];
        message.timestamp = Number(message.params[3]);
    },

    "335": function (message) {
        // :<server> 335 <me> <nickname> :is a Bot on <network name>
        // UnrealIRCd Only
        message.replyname = "RPL_WHOISBOT";
    },

    "346": function (message) {
        // :<server> 346 <me> <channel> <hostmaskPattern> <setter> <timestamp>
        message.replyname = "RPL_INVITELIST";
        message.channel = message.params[1];
        message.hostmaskPattern = message.params[2];
        message.setter = message.params[3];
        message.timestamp = message.params[4];
    },
    
    "348": function (message) {
        // :<server> 348 <me> <channel> <hostmaskPattern> <setter> <timestamp>
        message.replyname = "RPL_EXCEPTLIST";
        message.channel = message.params[1];
        message.hostmaskPattern = message.params[2];
        message.setter = message.params[3];
        message.timestamp = message.params[4];
    },

    "353": function (message) {
        // :<server> 353 <me> <sigil> <channel> :<nicknames>
        // <nickname> := ModeChar <> NickName
        // The replyname really doesn"t have an "E" in it.
        // The sigil is either an `=` or `@`.
        // Not sure there's any meaning behind it.
        message.replyname = "RPL_NAMREPLY";
        message.channel = message.params[2].toLowerCase();
        message.nicknames = message.params[3].trim().split(" ");
    },

    "366": function (message) {
        // :<server> 366 <me> <channel> :End of /NAMES list.
        message.replyname = "RPL_ENDOFNAMES";
        message.channel = message.params[1].toLowerCase();
    },

    "367": function (message) {
        // :<server> 367 <me> <channel> <hostmaskPattern> <setter> <timestamp>
        message.replyname = "RPL_BANLIST";
        message.channel = message.params[1];
        message.hostmaskPattern = message.params[2];
        message.setter = message.params[3];
        message.timestamp = message.params[4];
    },

    "372": function (message) {
        //:<server> 372 <me> :<motdLine>
        message.replyname = "RPL_MOTD";
    },

    "375": function (message) {
        //:<server> 375 <me> :<arbitrary>
        message.replyname = "RPL_STARTOFMOTD";
    },

    "376": function (message) {
        //:<server> 376 <me> :End of /MOTD command.
        message.replyname = "RPL_ENDOFMOTD";
    },

    "378": function (message) {
        // :<server> 378 <me> <nickname> :is connecting from <hostmask> <ip>
        message.replyname = "RPL_WHOISHOST";
        message.nickname = message.params[1];
        var words = message.params[2].split(" ");
        message.hostmask = words[3];
        message.ip = words[4];
    },

    "401": function (message) {
        // :<server> 401 <me> <nick> :No such nick/channel
        message.replyname= "ERR_NOSUCHNICK";
        message.nickname = message.params[1];
    },

    "403": function (message) {
        // :<server> 403 <me> <channel> :<reason>
        message.replyname = "ERR_NOSUCHCHANNEL";
        message.channel = message.params[1].toLowerCase();
    },

    "405": function (message) {
        // :<server> 405 <me> <channel> :<reason>
        message.replyname = "ERR_TOOMANYCHANNELS";
        message.channel = message.params[1].toLowerCase();
    },

    "421": function (message) {
        // :<server> 421 <me> <command> :Unknown command
        message.replyname = "ERR_UNKNOWNCOMMAND";
        message.unknownCommand = message.params[1].toLowerCase();
    },

    "437": function (message) {
        // :<server> 437 <me> <target> :Nick/channel is temporarily unavailable
        message.replyname = "ERR_UNAVAILRESOURCE";

        // TODO: Determine whether resource is channel or nickname.
        message.channel = message.params[1].toLowerCase();
        message.nickname = message.params[1];
        message.resource = message.params[1];
    },

    "442": function (message) {
        // :<server> 442 <me> <channel> :You're not on that channel
        message.replyname = "ERR_NOTONCHANNEL";
        message.channel = message.params[1].toLowerCase();
        message.reason = message.params[2];
    },

    "461": function (message) {
        // :<server> 461 <me> <command> :Not enough parameters
        message.replyname = "ERR_NEEDMOREPARAMS";
        message.command = message.params[1];
    },

    "471": function (message) {
        // :server> 471 <me> <channel> :Cannot join channel (+l)
        message.replyname = "ERR_CHANNELISFULL";
        message.channel = message.params[1].toLowerCase();
    },

    "473": function (message) {
        // :server 473 <me> <channel> :Cannot join channel (+i)
        message.replyname = "ERR_INVITEONLYCHAN";
        message.channel = message.params[1].toLowerCase();
    },

    "474": function (message) {
        // :<server> 474 <me> <channel> :Cannot join channel (+b)
        message.replyname = "ERR_BANNEDFROMCHAN";
        message.channel = message.params[1].toLowerCase();
    },

    "475": function (message) {
        // :server> 475 <me> <channel> :Cannot join channel (+k)
        message.replyname = "ERR_BADCHANNELKEY";
        message.channel = message.params[1].toLowerCase();
    },

    "477": function (message) {
        // :server> 477 <me> <channel> :You need a registered nick to join that channel.
        message.replyname = "ERR_NEEDREGGEDNICK";
        message.channel = message.params[1].toLowerCase();
    },

    "489": function (message) {
        // :<server> 489 <me> <channel> :Cannot join channel (SSL is required)
        message.replyname = "ERR_SECUREONLYCHAN";
        message.channel = message.params[1].toLowerCase();
    },

    "520": function (message) {
        // :server 520 <me> :Cannot join channel <channel> (IRCops only)
        // :server 520 <me> <channel> :<reason>
        message.replyname = "ERR_OPERONLY";

        if (message.params.length === 2) {
            // UnrealIRCd being stupid.
            message.channel = message.params[1].split(" ")[3].toLowerCase();
        } else {
            message.channel = message.params[1].toLowerCase();
        }
    },

    "671": function (message) {
        // :<server> 671 <me> <nickname> :is using a secure connection
        message.replyname = "RPL_WHOISSECURE"
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