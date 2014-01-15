var sinon$439 = require('sinon');
var assert$440 = require('better-assert');
var equal$441 = require('deep-eql');
var inspect$442 = require('util').inspect;
var format$443 = require('util').format;
var debug$444 = false;
var logfn$445 = debug$444 ? console.log.bind(console) : function () {
    };
var logger$446 = {
        debug: logfn$445,
        info: logfn$445,
        notice: logfn$445,
        warn: logfn$445,
        error: logfn$445
    };
var channel$447 = '#test';
var nickname$448 = 'testbot';
var nicknamefn$449 = function () {
    return nickname$448;
};
var OutputSocket$450 = require('../lib/output-socket.js');
var EventEmitter$451 = require('../lib/event-emitter.js');
describe('IRC Output Socket:', function () {
    var socket$453, out$454, messageHandler$455;
    beforeEach(function () {
        logfn$445();
        messageHandler$455 = new EventEmitter$451();
        socket$453 = { raw: sinon$439.spy() };
        out$454 = new OutputSocket$450(socket$453, messageHandler$455, nicknamefn$449, logger$446);
    });
    describe('Join:', function () {
        it('Sends the command.', function () {
            out$454.join(channel$447);
            assert$440(socket$453.raw.calledWithExactly(format$443('JOIN :%s', channel$447)));
        });
        it('On Success', function (done$465) {
            var joinmsg$466 = {
                    nickname: nickname$448,
                    channel: channel$447
                };
            socket$453.raw = function () {
                messageHandler$455.emit('join', joinmsg$466);
            };
            assert$440(out$454.join(channel$447) === undefined);
            done$465();
        });
    });
    it('can send private messages', function () {
        out$454.say('#test', 'Hi');
        assert$440(socket$453.raw.calledWithExactly('PRIVMSG #test :Hi'));
    });
    it('can part without a reason', function () {
        out$454.part('#test');
        assert$440(socket$453.raw.calledWithExactly('PART #test'));
    });
    it('can part with a reason', function () {
        out$454.part('#test', 'the reason');
        assert$440(socket$453.raw.calledWithExactly('PART #test :the reason'));
    });
    it('can quit without a reason', function () {
        out$454.quit();
        assert$440(socket$453.raw.calledWithExactly('QUIT'));
    });
    it('can quit with a reason', function () {
        out$454.quit('the reason');
        assert$440(socket$453.raw.calledWithExactly('QUIT :the reason'));
    });
});