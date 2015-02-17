const sinon = require("sinon");
const format = require("util").format;

const EventEmitter = require("events").EventEmitter;

var ix = 0;

const Socket = function (logger) {
    ix += 1;
    const sx = ix;

    return {
        connected: true,
        connect: function () {
            logger.debug("Connecting");
            this.emit("connect");
            setImmediate((function () {
                if (!this.connected) return;
                logger.debug("Emitting PING, 001, 005, MOTD");
                this.emit("data", "PING :PINGMESSAGE\r\n");
                this.emit("data", ":irc.test.net 001 testbot :Welcome to the Test IRC Network testbot!testuser@localhost\r\n");
                this.emit("data", ":irc.test.net 005 testbot STATUSMSG=@&~ :are supported by this server\r\n");
                this.emit("data", ":irc.test.net 375 testbot :irc.test.net -Beginning of MOTD-\r\n");
                this.emit("data", ":irc.test.net 372 testbot :One line MOTD.\r\n");
                this.emit("data", ":irc.test.net 376 testbot :End of MOTD\r\n");
                this.isConnected = true;
            }).bind(this));
        },

        end: function () {
            logger.debug("Closing");
            this.connected = false;
            this.emit("close");
        },

        write: sinon.spy(),
        setNoDelay: sinon.spy(),
        setEncoding: sinon.spy(),

        toString: function () {
            return format("[Object MockNetSocket %s]", sx);
        },

        on: EventEmitter.prototype.on,
        once: EventEmitter.prototype.once,
        emit: EventEmitter.prototype.emit,
        removeListener: EventEmitter.prototype.removeListener
    };
};

module.exports = Socket;