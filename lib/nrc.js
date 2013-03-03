/**
 *
 * This is mostly documented by readme.md.
 *
 */

var events = require('events');
var util = require('util');

var IrcSocket = require('./socket');
var IrcMessageEmitter = require('./irc-message-emitter');
var Commander = require('./commander');
var Modules = require('./modules');
var Subscriber = require('./bisubscriber');

var defaultNRCConfiguration = {
    channels: [],
    nickserv: "nickserv",
    password: undefined,
    nick: "nrcbot",
    user: "nrc",
    port: 6667,
    modules: [], // unimplemented
    realname: "nrc beta 0.3",
    trigger: '!'
};

var defaults = function (o, d) {
    var n = {};
    for (var key in d) {
        if (d.hasOwnProperty(key)) {
            if (o[key] === undefined) {
                n[key] = d[key];
            } else {
                n[key] = o[key];
            }
        }
    }
    return n;
};

/** Fields
 * _config
 * _socket
 * _messageParser
 * _commander
 * _nick
 * _subscriber
 * _modules
 */
var NRC = function (config, opt) {
    var that = this;

    // Parse the configuration object.
    this._config = config = defaults(config, defaultNRCConfiguration);

    // Create a socket.
    // The socket reads and sends messages from/to the IRC server.
    this._socket = new IrcSocket(config, opt);

    // Create the listener to the socket.
    // This listener will parse the raw messages of the socket, and
    // emits specific events to listen to.
    this._messageParser = new IrcMessageEmitter(this._socket, config, this);

    // Create the listener to private messages from the IRCMessageEmitter
    // The commander will parse these private messages for commands, and
    // emit those commands, also parsed.
    this._commander = new Commander(this.nick.bind(this), this, config, opt);
    this._nick = config.nick;

    // The subscriber handles event subscriptions to the NRC object,
    // determining whether they should be handled by the IrcMessageEmitter
    // or the Commander.
    this._subscriber = new Subscriber(this._messageParser, this._commander);
    this._subscriber.on("privmsg", this._commander.parseMessage.bind(this._commander));

    // And finally, the module system.
    this._modules = new Modules(this._subscriber);
    this.require(require("../modules/server"));
    //this.require(require("../modules/help"));
    //this.require(require("../modules/user"));

    // Standard event for IRC quitting.
    this._subscriber.on("error", function (event) {
        that.disconnect();
    });
};

// implements ConfigurationStorage

NRC.prototype.config = function (param) {
    return this._config[param];
};

// implements IRCClient

NRC.prototype.connect = function () {
    this._socket.connect();
    return this;
};

NRC.prototype.disconnect = function () {
    this._socket.end();
    return this;
};

NRC.prototype.say = function (location, message) {
    if (util.isArray(message)) {
        for (var ix = 0; ix < message.length; ix++) {
            this.say(message[ix]);
        }
        return this;
    }

    //Log.output(this.log, location + " " + message);
    this._socket.raw(["PRIVMSG", location, ":" + message].join(" "));
    return this;
};

NRC.prototype.act = function(location, message) {
    if (util.isArray(message)) {
        for (var ix = 0; ix < message.length; ix++) {
            this.act(message[ix]);
        }
        return this;
    }

    //Log.output(this.log, location + " " + message);
    this._socket.raw([
        "PRIVMSG",
        location,
        ":\u0001ACTION" + message + "\u0001"
    ].join(" "));
    return this;
};

NRC.prototype.join = function (channel) {
    this._socket.raw(["JOIN", channel]);
    return this;
};

NRC.prototype.part = function (channel, reason) {
    this._socket.raw(function () {
        var part = ["PART", channel];
        if (reason) {
            part.push(":" + reason);
        }
        return part;
    }());

    return this;
};

NRC.prototype.quit = function (reason) {
    this._socket.raw(["QUIT", reason ? ":" + reason : ""].join(" ").trim());
    return this;
};

NRC.prototype.nick = function (newNick) {
    if (newNick) {
        //Log.output(this.log, "nick " + newNick);
        this._socket.raw("NICK " + newNick);
        this._nick = newNick;
        return this;
    } else {
        return this._nick;
    }
};

// implements BiSubscriber

NRC.prototype.on = function (a1, a2) {
    this._subscriber.on(a1, a2);
};

NRC.prototype.once = function (a1, a2) {
    this._subscriber.once(a1, a2);
};

// implements ModuleSubscriber

NRC.prototype.require = function (module) {
    return this._modules.require(module);
};

NRC.prototype.use = function (name) {
    return this._modules.use(name);
};

NRC.prototype.isModule = function (name) {
  return this._modules.isModule(name);
};

NRC.prototype.getAllModuleNames = function () {
  return this._modules.getAllModuleNames();
};

NRC.prototype.getAllModuleExports = function () {
  return this._modules.getAllModuleExports();
};

// Export the class.
module.exports = NRC;