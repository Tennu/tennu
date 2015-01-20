const sinon = require('sinon');
const assert = require('better-assert');
const equal = require('deep-eql');
const inspect = require('util').inspect;
const format = require('util').format;
require('source-map-support').install();

const debug = false;
const logfn = debug ? console.log.bind(console) : function () {};
const logger = {debug: logfn, info: logfn, notice: logfn, warn: logfn, error: logfn};

const channel = "#test";
const nickname = 'testbot';

const nicknamefn = function () { return nickname; };

const ActionPlugin = require('../tennu_plugins/action');
const EventEmitter = require('after-events');

describe 'IRC Output Socket:' {
    var socket, out, messageHandler;

    beforeEach {
        logfn(/* newline */);
        messageHandler = new EventEmitter();
        socket = { raw: sinon.spy() };
        out = ActionPlugin.init({
            _socket: socket,
            //messageHandler,
            nickname: nicknamefn,
            info: logfn,
            note: logfn,
            on: function () {} // FIXME
        }).exports;
    }

    describe 'Join' {
        it 'Sends the command to the server' {
            out.join(channel);
            assert(socket.raw.calledWithExactly(format("JOIN :%s", channel)));
        }

        it skip 'On Success' (done) {
            const joinmsg = {nickname: nickname, channel: channel};

            socket.raw = function () {
                messageHandler.emit('join', joinmsg);
            };

            out.join(channel).then(function (join) {
                assert(join.channel === channel);
                assert(join.nickname === nickname);
                done();
            });
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