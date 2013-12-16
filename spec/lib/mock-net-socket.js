/*
mocksocket used for testing an ircsocket.
*/

var debug = function (msg) {
    if (false) {
        console.log('' + Date.now() + '|MOCKSOCKET|' + msg);
    }
};

var Socket = function () {
    debug("Creating a new one.");
    var connected = true;

    this.connect = jasmine.createSpy("connect").andCallFake(function () {
        debug("Connecting");
        this.emit("connect");
        setImmediate((function () {
            if (!connected) return;
            debug("Emitting PING, 001, and 005");
            this.emit("data", 'PING :PINGMESSAGE\r\n');
            this.emit("data", ":irc.test.net 001 testbot :Welcome to the Test IRC Network testbot!testuser@localhost\r\n");
            this.emit("data", ":irc.test.net 005 testbot STATUSMSG=@&~ :are supported by this server\r\n");
            this.isConnected = true;
        }).bind(this));
    });

    this.end = function () {
        debug("Closing");
        connected = false;
        this.emit("close");
    };

    this.write = jasmine.createSpy("mocksocket.write");
    this.setNoDelay = jasmine.createSpy();
    this.setEncoding = jasmine.createSpy();
};

Socket.prototype = new (require('events').EventEmitter)();
Socket.prototype.constructor = Socket;

module.exports = Socket;