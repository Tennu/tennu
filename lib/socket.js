/**
 * @author havvy
 * IRC Socket - handles communication between an IRC server and a Node.js script.
 */

var net = require('net');

/**
 * @constructor
 * @param {Object} network Network information. See Readme.md for info.
 * @param {function} handler Function that handles each line of input.
 * @param {Object} opt Optional parameters: socket
 */
var Socket = function (network, handler, opt) {
  that = this;
  
  this.nick = network.nick;
  this.user = network.user;
  this.password = network.password;
  this.port = network.port || 6667;
  this.netname = network.server;
  this.handle = handler;
  
  this.server = (opt && opt.socket) ? opt.socket : new net.Socket();
  this.connected = false;
  
  /**
   * @TODO Do not send last message if not finished
   * @TODO Refactor this to be less confusing.
   */
  this.onData = function (data) {
    data = data.split('\r\n');
    // Filter-Filter-Map pattern.
    for (var ix = 0; ix < data.length; ix++) {
      // Filter empty lines.
      if (data !== '') {
        // Filter pings.
        if (data[ix].indexOf('PING') === 0) {
          var reply = data[ix].slice(data[ix].indexOf(':'));
          that.raw("PONG " + reply);
        } else {
          // Map the handler.
          that.handle(data[ix]);
        }
      }
    }
  };
  
  this.server.once('connect', function () {
    that.connected = true;
    setTimeout((function () {
      that.raw("NICK " + network.nick);
      that.raw("USER " + (that.user || "shadow") + " 8 * :" + that._realname);
    }), 1000);

    setTimeout(function () {
      // Declare self as a bot.
      that.raw("MODE " + network.nick + " :+B");

      // Identify.
      if (network.password) {
        that.raw("PRIVMSG " + (network.nickserv || "Nickserv") + ":identify " + network.password);
      }

      // Join Default Channels.
      for (var channel in network.channels) {
        if (network.channels.hasOwnProperty(channel)) {
          that.raw("JOIN " + network.channels[channel]);
        }
      }
    }, 3000);
  });
  
  this.server.once('close', function () {
    that.connected = false;
  });
  
  this.server.on('data', this.onData);
  this.server.setEncoding('ascii');
  this.server.setNoDelay();
}

Socket.prototype = {
  /**
   * Connect to the IRC server.
   */
  connect : function () {
    if (this.isConnected()) {
      return;
    }
    
    this.server.connect(this.port, this.netname);
  },
  
  disconnect : function () {
    if (!this.isConnected()) {
      return;
    }
    
    this.server.end();
  },
  
  /**
   * Method to communicate with the network.
   *
   * @param message Message to send to network.
   */
  raw : function (message) {
    this.server.write(message + '\n', 'ascii');
    //this.log(message);
  },
  
  /**
   * @return Whether socket connected to a network.
   */
  isConnected : function () {
    return this.connected;
  },
  
  onConnect : function (handler) {
    this.server.on('connect', handler.bind(this));
  },
  
  onDisconnect : function (handler) {
    this.server.on('close', handler.bind(this));
  },
  
  getRealName : function () {
    return this._realname;
  },
  
  _realname : "nrc beta"
};

/*
  // Respond to pings with a pong.
  this.on('ping', function defaultPingHandler(e) {
    this.raw('PONG :' + e.params[0]);
  });
*/

module.exports = Socket;