/**
 * @author havvy
 * IRC Socket - handles communication between an IRC server and a Node.js script.
 *
 * This socket exposes the connect and end methods of the socket Interface.
 *
 * A network configuration object needs the following properties:
 *   server   - IRC server to connect to. _Example:_ _irc.mibbit.net_
 *   nick     - Nickname the bot will use.
 *   user     - Username the bot will use.
 *   realname - Realname for the bot.
 *   port     - Port to connect to. Defaults to 6667.
 *
 * Note that the only default value from the perspective of the socket is
 * the port. This class is reusable outside of the framework, should you want
 * to create your own framework.
 *
 * To send messages to the server, use socket.raw(). It accepts either a
 * string or an array which it will convert into a string by joining with
 * a space. The message must follow the IRC protocol. For example, to send a
 * message to the channel #evilbiscuits, you would send one of the following:
 *
 *   socket.raw("PRIVMSG #evilbiscuits :The message!");
 *   socket.raw(["PRIVMSG", "#evilbiscuits", ":The message!"]);
 *
 * <Documentation TODO: 'data event' & handled nuisances>
 *
 * Public methods
 *   - new(network: Object[, opt: Object]): IRCSocket
 *   - connect(): undefined
 *   - end(): undefined
 *   - raw(message: List[String]): undefined
 *   - raw(message: String): undefined
 *   - isConnected(): boolean
 *   - getRealName(): String
 *   - onConnect(callback: function): undefined
 *   - onDisconnect(callback: function): undefined
 *   + (from events.EventEmitter)
 *     - on
 *     - once
 *
 * Events
 *   - ready(): Once the first 001 message has been acknowledged.
 *   - data(message: String): Every message (including the 001) from the
 *     sender (inclusive) the the newline (exclusive).
 */

var net = require('net');
var events = require('events');
var util = require('util');
var Log = require('./protocols/log');

/**
 * @constructor
 * @param {Object} network Network information. See above for info.
 * @param {Object} opt Optional parameters: socket
 */
var Socket = function (network, opt) {
  that = this;
  events.EventEmitter.call(this);

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
      var line = data[ix];

      // Filter empty lines.
      if (line === '') {
        continue;
      }

      // Filter pings.
      if (line.indexOf('PING') === 0) {
        var reply = line.slice(line.indexOf(':'));
        that.raw(["PONG", reply]);
        continue;
      }

      // Map event emitting.
      Log.input(that.log, line);
      that.emit('data', line);
    }
  };

  var determineWhenReady = function (data) {
    data = data.split('\r\n');
    // Filter-Filter-Map pattern.
    for (var ix = 0; ix < data.length; ix++) {
      var line = data[ix];

      // Filter empty lines.
      if (line.length === 0) {
        continue;
      }
      line = line.split(" ");
      if (line[1] === "001") {
        that.emit("ready");
        that.server.removeListener('data', determineWhenReady);
        break;
      }
    }
  };

  this.server.once('connect', function () {
    that.connected = true;
    that.raw(["NICK", network.nick]);
    that.raw(["USER", network.user || "user", "8 * :" + network.realname]);
  });

  this.once('ready', function () {
    // RAWR! I'm a <s>monster</s> Bot!
    that.raw(["MODE", network.nick, ":+B"]);
  });

  this.server.once('close', function () {
    that.connected = false;
  });

  this.server.on('data', onData);
  this.server.on('data', determineWhenReady);
  this.server.setEncoding('ascii');
  this.server.setNoDelay();
};

Socket.prototype = new events.EventEmitter();

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
Socket.prototype.end = function () {
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
  if (util.isArray(message)) {
    message = message.join(" ");
  }

  this.server.write(message + '\n', 'ascii');
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

module.exports = Socket;