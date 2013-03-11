/*
mocksocket used for testing an ircsocket.
*/

var Socket = function () {
  this.connect = jasmine.createSpy("connect").andCallFake(function () {
    this.emit("connect");
    setTimeout((function () {
      this.emit("data", 'PING :PINGMESSAGE\r\n');
      this.emit("data", ":irc.test.net 001 testbot :Welcome to the Test IRC Network testbot!testuser@localhost\r\n");
      this.emit("data", ":irc.test.net 005 testbot STATUSMSG=@&~ :are supported by this server\r\n");
      this.isConnected = true;
    }).bind(this), 0);
  });

  this.end = function () {
    this.emit("close");
  };

  this.write = jasmine.createSpy("mocksocket.write");
  this.setNoDelay = jasmine.createSpy();
  this.setEncoding = jasmine.createSpy();
};

Socket.prototype = new (require('events').EventEmitter)();
Socket.prototype.constructor = Socket;

module.exports = Socket;