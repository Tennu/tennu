/**
 * @author havvy
 * mocksocket used for testing an ircsocket.
 */
var EE = require('events').EventEmitter;

var Socket = function () {
  EE.call(this);
};

Socket.prototype = new EE;

Socket.prototype.connect = function () {
  this.emit("connect");
  setTimeout((function () {
    this.emit("data", 'PING :PINGMESSAGE\r\n');
    this.emit("data", ":irc.test.net 001 testbot :Welcome to the Test IRC Network testbot!testuser@localhost\r\n");
    }).bind(this), 200);
};

Socket.prototype.end = function () {
    this.emit("close");
};

Socket.prototype.write = function (message) {
  void 0;
};

Socket.prototype.setNoDelay = function () {
  void 0;
};

Socket.prototype.setEncoding = function () {
  void 0;
};

Socket.prototype.sendMessage = function (message) {
  this.emit("data", message + "\r\n");
}

module.exports = Socket;