var sinon = require('sinon');
var assert = require('better-assert');
var equal = require('deep-eql');
var inspect = require('util').inspect;
var format = require('util').format;

var debug = false;
var logfn = debug ? console.log.bind(console) : function () {};
var logger = {debug: logfn, info: logfn, notice: logfn, warn: logfn, error: logfn};

var OutputSocket = require('../lib/output-socket');
var nickname = 'testbot';

describe('IRC Output Sockets', function () {
    var socket, out;

    beforeEach(function () {
        socket = { raw: sinon.spy() };
        out = new OutputSocket(socket, logger, nickname);
    });

    it('can send private messages', function () {
        out.say('#test', 'Hi');
        assert(socket.raw.calledWithExactly("PRIVMSG #test :Hi"));
    });

    it('can part without a reason', function () {
        out.part('#test');
        assert(socket.raw.calledWithExactly("PART #test"));
    });

    it('can part with a reason', function () {
        out.part('#test', 'the reason');
        assert(socket.raw.calledWithExactly("PART #test :the reason"));
    });

    it('can quit without a reason', function () {
        out.quit();
        assert(socket.raw.calledWithExactly("QUIT"));
    });

    it('can quit with a reason', function () {
        out.quit('the reason');
        assert(socket.raw.calledWithExactly("QUIT :the reason"));
    });
});