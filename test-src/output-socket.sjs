var sinon = require('sinon');
var assert = require('better-assert');
var equal = require('deep-eql');
var inspect = require('util').inspect;
var format = require('util').format;

var debug = false;
var logfn = debug ? console.log.bind(console) : function () {};
var logger = {debug: logfn, info: logfn, notice: logfn, warn: logfn, error: logfn};

var channel = "#test";
var nickname = 'testbot';

var nicknamefn = function () { return nickname; };

var OutputSocket = require('../lib/output-socket.js');
var EventEmitter = require('after-events');

describe 'IRC Output Socket:' {
    var socket, out, messageHandler;

    beforeEach {
        logfn(/* newline */);
        messageHandler = new EventEmitter();
        socket = { raw: sinon.spy() };
        out = new OutputSocket(socket, messageHandler, nicknamefn, logger);
    }

    describe 'Join:' {
        it 'Sends the command.' {
            out.join(channel);
            assert(socket.raw.calledWithExactly(format("JOIN :%s", channel)));
        }

        it 'On Success' (done) {
            var joinmsg = {nickname: nickname, channel: channel};

            socket.raw = function () {
                messageHandler.emit('join', joinmsg);
            };

            assert(out.join(channel) === undefined);
            done();
        }
    }

    it 'can send private messages' {
        out.say('#test', 'Hi');
        assert(socket.raw.calledWithExactly("PRIVMSG #test :Hi"));
    }

    it 'can part without a reason' {
        out.part('#test');
        assert(socket.raw.calledWithExactly("PART #test"));
    }

    it 'can part with a reason' {
        out.part('#test', 'the reason');
        assert(socket.raw.calledWithExactly("PART #test :the reason"));
    }

    it 'can quit without a reason' {
        out.quit();
        assert(socket.raw.calledWithExactly("QUIT"));
    }

    it 'can quit with a reason' {
        out.quit('the reason');
        assert(socket.raw.calledWithExactly("QUIT :the reason"));
    }
}