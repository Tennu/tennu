/**
 *
 * This is mostly documented by readme.md.
 *
 */

var events = require('events');
var util = require('util');

// TODO: Remove protocol stuff
var Log = require('./protocols/log');

var IrcSocket = require('./socket');
var Message = require('./structures/message');
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
 *
 * _nrcEmitter
 * _config
 * _socket
 * _commander
 * _nick
 * _subscriber
 * _modules
 *
 ** Callbacks
 *
 * _onData
 * _onReady
 */
var NRC = function (config, opt) {
    var that = this;
    this._config = config = defaults(config, defaultNRCConfiguration);

    this._nrcEmitter = new events.EventEmitter();

    this._socket = new IrcSocket(config, opt);
    this._commander = new Commander(this, config, opt);
    this._nick = config.nick;
    this.log = (opt && opt.log) || {};

    this._subscriber = new Subscriber(this._nrcEmitter, this._commander);

    // TODO: Get rid of context!
    this._subscriber.setContext(this._commander);
    this._subscriber.on("privmsg", this._commander.parseMessage);
    this._subscriber.setContext(this);

    this._modules = new Modules(this._subscriber);

    this._socket.on('data', this._onData.bind(this));
    this._socket.on('ready', this._onReady.bind(this));

    // Standard event for IRC quitting.
    this._subscriber.on("error", function (event) {
        this._socket.end();
    });
};

// IMPL STUFF

NRC.prototype._onReady = function () {
    this._nrcEmitter.emit("load");

    if (this._config.password) {
        this.say(this._config.nickserv, "identify " + this._config.password);
    }

    for (var ix = 0; ix < this._config.channels.length; ix++) {
        this.join(this._config.channels[ix]);
    }

    this._nrcEmitter.emit("ready");
};

NRC.prototype._onData = function (raw) {
    var event = Object.freeze(new Message(raw, this));

    // Emit the event.
    // Log Format: NAME [SENDER] PARAMETERS
    Log.event(this.log,
        [event.name,
        "[" + event.sender + "]",
        event.params.join(" ")].join(" "));

    this._nrcEmitter.emit(event.name, event);
};

// GETTER

NRC.prototype.config = function (param) {
    return this._config[param];
};

// ACTIONS

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

    Log.output(this.log, location + " " + message);
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

    Log.output(this.log, location + " " + message);
    this._socket.raw([
        "PRIVMSG",
        location,
        ":\u0001ACTION" + message + "\u0001"
    ].join(" "));
    return this;
};

NRC.prototype.join = function (channel) {
    Log.output(this.log, "join " + channel);
    this._socket.raw(["JOIN", channel]);
    return this;
};

NRC.prototype.part = function (channel, reason) {
    Log.output(this.log, "part " + channel + " " + reason);

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
    Log.output(this.log, "quit " + reason);
    this._socket.raw(["QUIT", reason ? ":" + reason : ""].join(" ").trim());
    return this;
};

NRC.prototype.nick = function (newNick) {
    if (newNick) {
        Log.output(this.log, "nick " + newNick);
        this._socket.raw("NICK " + newNick);
        this._nick = newNick;
        return this;
    } else {
        return this._nick;
    }
};

// EVENTS

NRC.prototype.on = function (a1, a2) {
    this._subscriber.on(a1, a2);
};

NRC.prototype.once = function (a1, a2) {
    this._subscriber.once(a1, a2);
};

// MODULES

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