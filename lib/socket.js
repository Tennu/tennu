/**
 * @author havvy
 * IRC Socket - handles communication between an IRC server and a Node.js script.
 */

var net = require('net');
var events = require('events');
var Log = require('./protocols/log');

/**
 * @constructor
 * @param {Object} network Network information. See Readme.md for info.
 * @param {Object} opt Optional parameters: socket
 */
var Socket = function (network, opt) {
  that = this;
  events.EventEmitter.call(this);
  
  this.nick = network.nick;
  this.user = network.user;
  this.port = network.port || 6667;
  this.netname = network.server;
  
  this.server = (opt && opt.socket) ? opt.socket : new net.Socket();
  this.log = (opt && opt.logger) || {};
  this.connected = false;
  
  /**
   * @TODO Do not send last message if not finished
   * @TODO Refactor this to be less confusing.
   */
  var onData = function (data) {
    data = data.split('\r\n');
    // Filter-Filter-Map pattern.
    for (var ix = 0; ix < data.length; ix++) {
      // Filter empty lines.
      if (data[ix] === '') {
        continue;
      }
      
      // Filter pings.
      if (data[ix].indexOf('PING') === 0) {
        var reply = data[ix].slice(data[ix].indexOf(':'));
        that.server.write("PONG " + reply + '\n', 'ascii');
        continue;
      }
      
      // Map event emitting.
      Log.input(that.log, data[ix]);
      that.emit('data', data[ix]);
    }
  };
  
  var determineWhenReady = function (data) {
    var lines = data.split('\r\n');
    // Filter-Filter-Map pattern.
    for (var ix = 0; ix < lines.length; ix++) {
      // Filter empty lines.
      if (lines[ix] === '') {
        continue;
      }
      lines[ix] = lines[ix].split(" ");
      if (lines[ix][1] === "001") {
       that.emit("ready");
       //that.server.removeListener('data', determineWhenReady);
       break;
      }
    }
  };
  
  this.server.once('connect', function () {
    that.connected = true;
    that.raw("NICK " + network.nick);
    that.raw("USER " + (that.user || "shadow") + " 8 * :" + that._realname);
  });
  
  this.once('ready', function () {
    that.raw("MODE " + network.nick + " :+B"); // RAWR! I'm a <s>monster</s> Bot!
  });
  
  this.server.once('close', function () {
    that.connected = false;
  });
  
  this.server.on('data', onData);
  this.server.on('data', determineWhenReady);
  this.server.setEncoding('ascii');
  this.server.setNoDelay();
};

Socket.prototype = new events.EventEmitter;

/**
 * Connect to the IRC server.
 */
Socket.prototype.connect = function () {
  if (this.isConnected()) {
    return;
  }
  
  this.server.connect(this.port, this.netname);
};

/**
 * Disconnect from the server without a reason.
 */
Socket.prototype.disconnect = function () {
  if (!this.isConnected()) {
    return;
  }
  
  this.server.end();
};
  
/**
 * Communicate with the network.
 *
 * @param message Message to send to network.
 */
Socket.prototype.raw = function (message) {
  this.server.write(message + '\n', 'ascii');
  Log.output(this.log, message);
};

/**
 * @return Whether socket connected to a network.
 */
Socket.prototype.isConnected = function () {
  return this.connected;
};

/**
 * @return Real name of the bot.
 */
Socket.prototype.getRealName = function () {
  return this._realname;
};

/**
 * Event handler for what to do after connected to the server.
 */
Socket.prototype.onConnect = function (handler) {
  this.server.on('connect', handler.bind(this));
};

/**
 * Event handler for what to do after disconnected from the server.
 */
Socket.prototype.onDisconnect = function (handler) {
  this.server.on('close', handler.bind(this));
};

Socket.prototype._realname = "nrc beta";

module.exports = Socket;