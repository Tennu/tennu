/**
 * @author havvy
 */

var events = require('events');
var Log = require('./protocols/log');
var IrcSocket = require('./socket');
var Message = require('./structures/message');
var Commander = require('./commander');

var NRC = function (config, opt) {
  var that = this;
  events.EventEmitter.call(this);
  
  this._socket = new IrcSocket(config, opt);
  this._commander = new Commander(this, config, opt);
  this._nick = config.nick;
  this.log = (opt && opt.log) || {};
  
  this._socket.on('data', function (raw) {
    // Parse the raw message, getting an event object. Disallow modification.
    var event = Object.freeze(new Message(raw, this));

    // Emit the event.
    Log.event(that.log, event.name);
    that.emit(event.name, event);
  }.bind(this));
  
  this.on("error", function (event) {
    this._socket.disconnect();
  });
};

NRC.prototype = new events.EventEmitter;

NRC.prototype.connect = function () {
  this._socket.on('ready', (function () {
    this.emit("ready");
  }).bind(this));
  this._socket.connect();
};

NRC.prototype.disconnect = function () {
  this._socket.disconnect();
};

NRC.prototype.say = function (location, message) {
  this._socket.raw(["PRIVMSG", location, ":" + message].join(" "));
};

NRC.prototype.join = function (channel) {
  this._socket.raw("JOIN " + channel);
};

NRC.prototype.part = function (channel, reason) {
  if (reason) {
    this._socket.raw(["PART", channel, ":" + reason].join(" "));
  } else {
    this._socket.raw("PART " + channel);
  }
};

NRC.prototype.quit = function (reason) {
  if (reason) {
    this._socket.raw(["QUIT", ":" + reason].join(" "));
  } else {
    this._socket.raw("QUIT");
  }
};

NRC.prototype.getNick = function () {
  return this._nick;
};

NRC.prototype.getCommandEmitter = function () {
  return this._commander;
};

module.exports = NRC;