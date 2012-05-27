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
 * A thing.
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
    // Parse the raw message, getting an event object. Disallow modification.
    var event = Object.freeze(new Message(raw, that));

    // Emit the event.
    // Format: NAME [SENDER] PARAMETERS
    Log.event(that.log, event.name + " [" + event.sender + "] " + event.params.join(" "));
    that.emit(event.name, event);
  });

  this._socket.on('ready', function () {
    var channels = config.channels;

    that.say(config.nickserv, "identify " + config.password);

    console.log(util.inspect(channels));
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

  // TODO Test this.
  this.on("nick", function (event) {
    if (event.actor === that.getNick()) {
      that.setNick(event.newNick);
    }
  });
};

NRC.prototype = new events.EventEmitter;

NRC.prototype.connect = function () {
  this._socket.connect();
};

NRC.prototype.disconnect = function () {
  this._socket.disconnect();
};

NRC.prototype.say = function (location, message) {
  Log.output(this.log, location + " " + message);
  this._socket.raw(["PRIVMSG", location, ":" + message].join(" "));
};

NRC.prototype.join = function (channel) {
  Log.output(this.log, "join " + channel);
  this._socket.raw("JOIN " + channel);
};

NRC.prototype.part = function (channel, reason) {
  Log.output(this.log, "part " + channel + " " + reason);
  this._socket.raw(["PART", channel, reason ? ":" + reason : ""].join(" ").trim());
};

NRC.prototype.quit = function (reason) {
  Log.output(this.log, "quit " + reason);
  this._socket.raw(["QUIT", reason ? ":" + reason : ""].join(" ").trim());
};

NRC.prototype.nick = function (newNick) {
  Log.output(this.log, "nick " + newNick);
  this._socket.raw("NICK " + newNick);
};

NRC.prototype.getNick = function () {
  return this._nick;
};

NRC.prototype.setNick = function (name) {
  this._nick = name;
};

NRC.prototype.getCommandEmitter = function () {
  return this._commander;
};

NRC.prototype.config = function (param) {
  return this._config[param];
};

module.exports = NRC;