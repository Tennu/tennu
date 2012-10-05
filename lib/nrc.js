/**
 * @author havvy
 */

var events = require('events');
var Log = require('./protocols/log');
var IrcSocket = require('./socket');
var Message = require('./structures/message');
var Commander = require('./commander');
var util = require('util');

/**
 * The Node Relay Chat object. See the Readme for how to use.
 * @param {Object} config
 * @param {Object} opt
 */
var NRC = function (config, opt) {
  var that = this;
  events.EventEmitter.call(this);

  this._config = config;
  this._socket = new IrcSocket(config, opt);
  this._commander = new Commander(this, config, opt);
  this._nick = config.nick;
  var obj = {};
  this.log = (opt && opt.log) || obj;

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
    var channels = config.channels;

    that.say(config.nickserv, "identify " + config.password);

    for (chan in channels) {
      if (channels.hasOwnProperty(chan)) {
        that.join(channels[chan]);
      }
    }

    that.emit("ready");
  });

  this.on("error", function (event) {
    this._socket.disconnect();
  });
};

NRC.prototype = new events.EventEmitter;
NRC.p = NRC.prototype;

NRC.p.connect = function () {
  this._socket.connect();
};

NRC.p.disconnect = function () {
  this._socket.disconnect();
};

NRC.p.say = function (location, message) {
  Log.output(this.log, location + " " + message);
  this._socket.raw(["PRIVMSG", location, ":" + message].join(" "));
};

NRC.p.act = function(location, message) {
  Log.output(this.log, location + " " + message);
  // The  char is 0x0001.
  this._socket.raw(["PRIVMSG", location, ":ACTION" + message + ""].join(" "));
};

NRC.p.join = function (channel) {
  Log.output(this.log, "join " + channel);
  this._socket.raw("JOIN " + channel);
};

NRC.p.part = function (channel, reason) {
  Log.output(this.log, "part " + channel + " " + reason);
  this._socket.raw(["PART", channel, reason ? ":" + reason : ""].join(" ").trim());
};

NRC.p.quit = function (reason) {
  Log.output(this.log, "quit " + reason);
  this._socket.raw(["QUIT", reason ? ":" + reason : ""].join(" ").trim());
};

NRC.p.nick = function (newNick) {
  Log.output(this.log, "nick " + newNick);
  this._socket.raw("NICK " + newNick);
  this._nick = newNick;
};

NRC.p.getNick = function () {
  return this._nick;
};

NRC.p.getCommandEmitter = function () {
  return this._commander;
};

NRC.p.config = function (param) {
  return this._config[param];
};

NRC.p.loadModule = function (module) {
  module.forEach(function (handler) {
    var listener = handler.irc ? this : this._commander;
    var quantity = handler.once ? "once" : "on";

    listener[quantity](handler.trigger, handler.handler)
  });
}

module.exports = NRC;