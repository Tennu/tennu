var sinon$587 = require('sinon');
var assert$588 = require('better-assert');
var equal$589 = require('deep-eql');
var inspect$590 = require('util').inspect;
var format$591 = require('util').format;
const debug$592 = false;
const logfn$593 = debug$592 ? console.log.bind(console) : function () {
    };
const logger$594 = {
        debug: logfn$593,
        info: logfn$593,
        notice: logfn$593,
        warn: logfn$593,
        error: logfn$593
    };
const MessageHandler$595 = require('../lib/message-handler.js');
const Message$596 = require('../lib/message.js');
const Q$597 = require('q');
const id$598 = function () {
        var ix = 0;
        return function () {
            ix += 1;
            return ix;
        };
    }();
const prefix$599 = 'irc.mibbit.net';
const command$600 = 'generic';
const arg1$601 = 'arg1';
const arg2$602 = 'arg2';
const argr$603 = 'rest args';
const raw$604 = format$591(':%s %s %s %s :%s', prefix$599, command$600, arg1$601, arg2$602, argr$603);
describe('Message Parsers', function () {
    var parser$606, receiver$607;
    beforeEach(function () {
        logfn$593();
        receiver$607 = { _id: id$598() };
        parser$606 = MessageHandler$595(receiver$607);
    });
    describe('#parse', function () {
        var retval$611, evtval$612;
        beforeEach(function (done$617) {
            parser$606.on('generic', function (message$618) {
                evtval$612 = message$618;
                done$617();
            });
            retval$611 = parser$606.parse(raw$604);
        });
        it('Return value', function () {
            assert$588(retval$611.prefix === prefix$599);
            assert$588(retval$611.command === command$600);
            assert$588(retval$611.params[0] === arg1$601);
            assert$588(retval$611.params[1] === arg2$602);
            assert$588(retval$611.params[2] === argr$603);
            assert$588(retval$611.receiver === receiver$607);
        });
        it('Event Value', function () {
            assert$588(evtval$612.prefix === prefix$599);
            assert$588(evtval$612.command === command$600);
            assert$588(evtval$612.params[0] === arg1$601);
            assert$588(evtval$612.params[1] === arg2$602);
            assert$588(evtval$612.params[2] === argr$603);
            assert$588(evtval$612.receiver === receiver$607);
        });
        it('Emit and Return value are the same', function () {
            assert$588(retval$611 === evtval$612);
        });
    });
    describe('`*` event', function () {
        it('is called with every function', function (done$620) {
            var count$621 = 0;
            parser$606.on('*', function (message$622) {
                count$621 += 1;
                if (count$621 === 2) {
                    done$620();
                }
            });
            parser$606.parse(raw$604);
            parser$606.parse(raw$604);
        });
    });
});