var sinon$662 = require('sinon');
var assert$663 = require('better-assert');
var equal$664 = require('deep-eql');
var inspect$665 = require('util').inspect;
var format$666 = require('util').format;
var debug$667 = false;
var logfn$668 = debug$667 ? console.log.bind(console) : function () {
    };
var logger$669 = {
        debug: logfn$668,
        info: logfn$668,
        notice: logfn$668,
        warn: logfn$668,
        error: logfn$668
    };
var channel$670 = '#test';
var nickname$671 = 'testbot';
var nicknamefn$672 = function () {
    return nickname$671;
};
var OutputSocket$673 = require('../lib/output-socket.js');
var EventEmitter$674 = require('../lib/event-emitter.js');
describe('IRC Output Socket:', function () {
    var socket$676, out$677, messageHandler$678;
    beforeEach(function () {
        logfn$668();
        messageHandler$678 = new EventEmitter$674();
        socket$676 = { raw: sinon$662.spy() };
        out$677 = new OutputSocket$673(socket$676, messageHandler$678, nicknamefn$672, logger$669);
    });
    describe('Join:', function () {
        it('Sends the command.', function () {
            out$677.join(channel$670);
            assert$663(socket$676.raw.calledWithExactly(format$666('JOIN :%s', channel$670)));
        });
        it('On Success', function (done$688) {
            var joinmsg$689 = {
                    nickname: nickname$671,
                    channel: channel$670
                };
            socket$676.raw = function () {
                messageHandler$678.emit('join', joinmsg$689);
            };
            assert$663(out$677.join(channel$670) === undefined);
            done$688();
        });
    });
    it('can send private messages', function () {
        out$677.say('#test', 'Hi');
        assert$663(socket$676.raw.calledWithExactly('PRIVMSG #test :Hi'));
    });
    it('can part without a reason', function () {
        out$677.part('#test');
        assert$663(socket$676.raw.calledWithExactly('PART #test'));
    });
    it('can part with a reason', function () {
        out$677.part('#test', 'the reason');
        assert$663(socket$676.raw.calledWithExactly('PART #test :the reason'));
    });
    it('can quit without a reason', function () {
        out$677.quit();
        assert$663(socket$676.raw.calledWithExactly('QUIT'));
    });
    it('can quit with a reason', function () {
        out$677.quit('the reason');
        assert$663(socket$676.raw.calledWithExactly('QUIT :the reason'));
    });
});