var events = require('events');
var Log = require('./protocols/log');
var IrcSocket = require('./socket');
var Message = require('./structures/message');
var Commander = require('./commander');
var util = require('util');

var NRC = function (config, opt) {
    var that = this;
    events.EventEmitter.call(this);

    this._config = config;
    this._socket = new IrcSocket(config, opt);
    this._commander = new Commander(this, config, opt);
    this._nick = config.nick;
    this._loadedModuleNames = [];
    this._modules = {};
    this.log = (opt && opt.log) || {};

    this._socket.on('data', function (raw) {
        var event = Object.freeze(new Message(raw, that));

        // Emit the event.
        // Log Format: NAME [SENDER] PARAMETERS
        Log.event(that.log,
            [event.name,
            "[" + event.sender + "]",
            event.params.join(" ")].join(" "));

        that.emit(event.name, event);
    });

    this._socket.on('ready', function () {
        that.emit("load");

        var channels = config.channels;

        that.say(config.nickserv, "identify " + config.password);

        for (var chan in channels) {
            if (channels.hasOwnProperty(chan)) {
                that.join(channels[chan]);
            }
        }

        that.emit("ready");
    });

    this.on("error", function (event) {
        this._socket.disconnect();
    });

    this.require(require("../modules/help"));
    this.require(require("../modules/user"));
    this.require(require("../modules/server"));
};

NRC.prototype = new events.EventEmitter();
NRC.prototype.constructor = NRC;

NRC.prototype.config = function (param) {
    return this._config[param];
};

// EVENTS

NRC.prototype._onString = function (string, listener) {
    var that = this;

    var listenerWrapper = function () {
        try {
            listener.apply(this, arguments);
        } catch (err) {
            console.log(err.stack);
        }
    };

    string.split(" ").forEach(function (event) {
        if (event[0] === '!') {
            that._commander.on(event.substr(1), listenerWrapper);
        } else {
            events.EventEmitter.prototype.on.call(that, event, listenerWrapper);
        }
    });
};

NRC.prototype._onMap = function (map) {
    for (var event in map) {
        this._onString(event, map[event]);
    }
};

NRC.prototype.on = function () {
    switch (arguments.length) {
        case 1: this._onMap(arguments[0]); break;
        case 2: this._onString(arguments[0], arguments[1]); break;
        default: throw new Exception("on takes one or two arguments.");
    }
};

NRC.prototype._onceString = function (string, listener) {
    var that = this;

    var listenerWrapper = function () {
        try {
            listener.apply(this, arguments);
        } catch (err) {
            console.log(err.stack;
        }
    };

    string.split(" ").forEach(function (event) {
        if (event[0] === '!') {
            that._commander.on(string, listenerWrapper);
        } else {
            events.EventEmitter.prototype.once.call(that, event, listenerWrapper);
        }
    });
};

NRC.prototype._onceMap = function (ee, map) {
    for (var event in map) {
        this._onceString(event, map[event]);
    }
};

NRC.prototype.once = function () {
    switch (arguments.length) {
        case 1: return this._onceMap(arguments[0]);
        case 2: return this._onceString(arguments[0], arguments[1]);
        default: throw new Exception("on takes one or two arguments.");
    }
};

// ACTIONS

NRC.prototype.connect = function () {
    this._socket.connect();
    return this;
};

NRC.prototype.disconnect = function () {
    this._socket.disconnect();
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
    this._socket.raw("JOIN " + channel);
    return this;
};

NRC.prototype.part = function (channel, reason) {
    Log.output(this.log, "part " + channel + " " + reason);
    this._socket.raw([
        "PART",
        channel,
        reason ? ":" + reason : ""
    ].join(" ").trim());
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

// MODULES

NRC.prototype.require = function (module) {
  var that = this;

  function listen (event, listener) {
    if (event[0] === '!') {
      that._commander.on(event.substr(1), listener);
    } else {
      that.on(event, listener);
    }
  }

  // DEPENDENCIES
  if (module.dependencies) {
    module.dependencies.forEach(function (dependency) {
      if (!that.isModule(dependency)) {
        throw new Error("Module dependency," + dependency +
          ", not loaded for module" + module.name);
      }
    });
  }

  // NAME
  if (this.isModule(module.name)) {
    throw new Error("Tried to load same module, " + module.name + ", twice.");
  } else if (module.name.length === 0) {
    throw new Error("Module must be named.");
  }

  this._loadedModuleNames.push(module.name);

  // HANDLERS
  for (var handler in module.handlers) {
    var events = handler.split(" ");
    var listener = module.handlers[handler];

    for (var ix = 0; ix < events.length; ix++) {
      listen(events[ix], listener);
    }
  }

  // EXPORTS
  this._modules[module.name] = module.exports || {};
  this._modules[module.name].name = module.name;

  return this;
};

NRC.prototype.use = function (name) {
  return this._modules[name];
};

NRC.prototype.isModule = function (name) {
  return this._loadedModuleNames.indexOf(name) !== -1;
};

NRC.prototype.getAllModuleNames = function () {
  var names = [];
  for (var ix = 0; ix < this._loadedModuleNames; ix++) {
    names[ix] = this._loadedModuleNames[ix];
  }
  return names;
};

NRC.prototype.getAllModuleExports = function () {
  var that = this;
  var exports = {};
  this.getAllModuleNames().forEach(function (name) {
    exports[name] = that.modules[name];
  });
  return exports;
};

module.exports = NRC;