const sinon = require('sinon');

const EventEmitter = require('events').EventEmitter;

var ix = 0;

const Socket = function (logger) {
    ix += 1;
    const ixNow = ix;

    return {
        connected: true,
        connect: function () {
            logger.debug("Connecting");
            this.emit("connect");
            //logger.info(new Error().stack);
            setImmediate((function () {
                if (!this.connected) return;
                logger.debug("Emitting PING, 001, and 005");
                this.emit("data", 'PING :PINGMESSAGE\r\n');
                this.emit("data", ":irc.test.net 001 testbot :Welcome to the Test IRC Network testbot!testuser@localhost\r\n");
                this.emit("data", ":irc.test.net 005 testbot STATUSMSG=@&~ :are supported by this server\r\n");
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
            return '[Object MockNetSocket ' + ixNow + ']';
        },

        on: EventEmitter.prototype.on,
        once: EventEmitter.prototype.once,
        emit: EventEmitter.prototype.emit,
        removeListener: EventEmitter.prototype.removeListener
    };
};

module.exports = Socket;