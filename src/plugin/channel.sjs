var AUTH = { // Default Auth Object
    "+": "v",
    "%": "h",
    "@": "o",
    "&": "a",
    "~": "q"
}
// Object types
var Channel = function Channel(name) {
    if (!name) return null;
    var channel = Object.create(Channel.prototype);
    channel.name = name;
    channel.users = {};
    channel.topic = "";
    channel.topicHistory = []; // [Current, Previous, ... , First Known Topic]

    channel.banList = {};
    channel.exceptList = {};
    channel.inviteList = {};

    channel.modes = {
        v: {},
        h: {},
        o: {},
        a: {},
        q: {},
        b: {},
        e: {},
        I: {}
    };

    return channel;
}

Channel.prototype = {
    toString: function () {
        return this.name;
    },
    
    addUser: function (nick) {
        var authModes = [];
        while (nick[0] in AUTH) {
            authModes.push(AUTH[nick[0]]);
            nick = nick.slice(1);
        }
        this.users[nick] = nick;
        var addAuthToNick = function (mode) {
            this.updateModes({mode: mode, parameter: nick, set: true});
        };
        authModes.forEach(addAuthToNick.bind(this));
    },

    removeUser: function (nick) {
        delete this.users[nick];
        for (var symbol in AUTH) {
            if (this.modes[AUTH[symbol]][nick]) this.updateModes({mode: AUTH[symbol], parameter: nick, set: false});
        }
    },
    
    renameUser: function (nick, newNick) {
        this.users[newNick] = this.users[nick];
        for (var symbol in AUTH) {
            if (this.modes[AUTH[symbol]][nick]) this.updateModes({mode: AUTH[symbol], parameter: newNick}, this.modes[AUTH[symbol]][nick]);
        }
        this.removeUser(nick);
    },
    
    getUsers: function () {
        return Object.keys(this.users);
    },
    
    forEachUser: function (fn) { // Iterate over user nicks
        if (typeof fn !== "function") return null;
        this.getUsers().forEach(fn);
        return true;
    },
    
    updateTopic: function (topic) {
        this.topic = topic;
        this.topicHistory.unshift({topic:topic});
    },
    
    updateTopicInfo: function (editedBy, lastEdited) {
        this.topicHistory[0].editedBy = editedBy;
        this.topicHistory[0].lastEdited = lastEdited;
    },
    
    updateModes: function (modeObj, sender, time) {
        time = Number(time) || Date.now();
        var mode = modeObj.mode, set = !!modeObj.set, parameter = modeObj.parameter || false;
        var listModes = {"v":"+","h":"%","o":"@","a":"&","q":"~","b":"bans","e":"excepts","I":"invited"};
        if (mode in listModes) {
            if (!this.modes[mode]) this.modes[mode] = {};
            if (set) {
                this.modes[mode][parameter] = sender || undefined;
            } else {
                delete this.modes[mode][parameter];
            }
        } else {
            if (set) {
                this.modes[mode] = parameter || true;
            } else {
                client.debug("Removing "+mode+" mode.");
                delete this.modes[mode];
            }
        }
        // Additional Mode-specific Handling
        switch (mode) {
            case "b":
                this.addBan(parameter, sender, time);
                break;
            case "e":
                this.addExcept(parameter, sender, time);
                break;
            case "I":
                this.addInvite(parameter, sender, time);
                break;
        }
    },
    
    // If auth is a valid user mode string (v/h/o/a/q and their respective sigils)
    //   return a boolean if the user is at or above that auth level.
    // Else Returns the highest user mode q > a > o > h > v
    highestAuth: function (nick, auth) {
        nick = nick || "";
        if (!this.users[nick]) return null;
        if (auth in AUTH) auth = AUTH[auth];
        var authLevels = ["q", "a", "o", "h", "v"];
        auth = authLevels.indexOf(auth) > -1 ? auth : false;
        var nickAuth = "";
        for (var mode in authModes) {
            if (this.modes[mode][nick]) {
                if (auth) {
                    if (authLevels.indexOf(mode) <= authLevels.indexOf(auth)) {
                        nickAuth = true;
                        break;
                    }
                } else {
                    nickAuth += mode;
                    continue;
                }
            }
        }
        if (auth && !nickAuth) return false;
        return nickAuth;
    },
    addBan: function (target, setBy, setTime, reason) {
        if (!target) return null;
        setBy = setBy || "";
        setTime = Number(setTime) || Date.now();
        reason = reason || "";
        this.banList[target] = {
            setBy: setBy,
            setTime: setTime,
            reason: reason
        };
        return true;
    },
    addExcept: function (target, setBy, setTime) {
        if (!target) return null;
        setBy = setBy || "";
        setTime = Number(setTime) || Date.now();
        this.exceptList[target] = {
            setBy: setBy,
            setTime: setTime
        };
        return true;
    },
    addInvite: function (target, setBy, setTime) {
        if (!target) return null;
        setBy = setBy || "";
        setTime = Number(setTime) || Date.now();
        this.inviteList[target] = {
            setBy: setBy,
            setTime: setTime
        };
        return true;
    }
};

var channel_plugin = {
    name: "channels",
    requires: ["messages"],
    init: function (client, imports) {
        var Channels = function Channels(name) {
            if (typeof name === "undefined") return Channels.chans();
            if (typeof name === "string") return Channels.get(name);
        }
        Channels.channels = {};
        Channels.get = function (name) {
            return Channels.channels[name];
        }
        Channels.all = function (sortFn) {
            return Object.keys(Channels.channels).sort(sortFn)
        }
        Channels.chans = function (sortFn) {
            return Object.keys(Channels.channels).map(Channels.get).sort(sortFn);
        }

        const addChannel = function (name) {
            Channels.channels[name] = Channel(name);
        };

        const removeChannel = function (name) {
            delete Channels.channels[name];
        }

        var handles = {
            "join": function (msg) { // client.on("join") Add a user or channel
                var isSelf = client.nickname() === msg.nickname;
                if (isSelf) {
                    addChannel(msg.channel);
                    client.mode(msg.channel, "b"); // Get bans
                    client.mode(msg.channel, "e"); // Get excepts
                    client.mode(msg.channel, "I"); // Get invites
                } else {
                    Channels(msg.channel).addUser(msg.nickname);
                }
            },
            "quit": function (msg) { // client.on("quit") Remove user from all channels and from user list
                var nick = msg.nickname;
                var reason = msg.reason;
                Channels.chans().forEach(function (chan) {
                    if (nick in chan.users) chan.removeUser(nick);
                });
            },
            "part": function (msg) { // client.on("part") Remove user from parted channel
                var isSelf = client.nickname() === msg.nickname;
                if (isSelf) {
                    delete removeChannel(msg.channel);
                } else {
                    Channels(msg.channel).removeUser(msg.nickname);
                }
            },
            "kick": function (msg) { // client.on("kick") Remove kicked user from channel
                var isSelf = client.nickname() === msg.kicked;
                if (isSelf) {
                    delete removeChannel(msg.channel);
                } else {
                    Channels(msg.channel).removeUser(msg.kicked);
                }
            },
            "nick": function (msg) { // client.on("nick") Update nick across channels
                var nick = msg.old;
                var newNick = msg.new;
                Channels.chans().forEach(function (chan) {
                    if (nick in chan.users) chan.renameUser(nick, newNick);
                });
            },
            "332" : function (msg) { // client.on("332") Update Topic
                var channel = msg.channel;
                Channels(channel).updateTopic(msg.topic);
            },
            "333": function (msg) { // client.on("333") Update Topic Info
                Channels(msg.channel).updateTopicInfo(msg.who, msg.timestamp);
            },
            "353" : function (msg) { // client.on("353") Update channel with users
                var channel = Channels(msg.channel);
                msg.nicknames.forEach(channel.addUser.bind(channel));
            },
            // Lists
            // Banlist
            "367": function (msg) {
                var channel = Channels(msg.channel);
                if (!channel) return;
                channel.updateModes({mode: "b", parameter: msg.hostmaskPattern, set: true}, msg.setter, msg.timestamp);
            },
            // exceptList
            "346": function (msg) {
                var channel = Channels(msg.channel);
                channel.updateModes({mode: "e", parameter: msg.hostmaskPattern, set: true}, msg.setter, msg.timestamp);
            },
            // inviteList
            "348": function (msg) {
                var channel = Channels(msg.channel);
                channel.updateModes({mode: "I", parameter: msg.hostmaskPattern, set: true}, msg.setter, msg.timestamp);
            },
            "mode": function (msg) {
                if (msg.channel.charAt(0) !== "#") return;
                var handleMode = (function (modeObj) {
                    Channels(msg.channel).updateModes(modeObj, msg.nickname);
                }).bind(Channels(msg.channel));
                msg.modes.forEach(handleMode);
            }
        };
        return {
            handlers: handles,
            help: {},
            exports: Channels,
            commands: [],
       };
    }
}

module.exports = channel_plugin;
