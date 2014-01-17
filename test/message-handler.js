var sinon$561 = require('sinon');
var assert$562 = require('better-assert');
var equal$563 = require('deep-eql');
var inspect$564 = require('util').inspect;
var format$565 = require('util').format;
const debug$566 = false;
const logfn$567 = debug$566 ? console.log.bind(console) : function () {
    };
const logger$568 = {
        debug: logfn$567,
        info: logfn$567,
        notice: logfn$567,
        warn: logfn$567,
        error: logfn$567
    };
const MessageHandler$569 = require('../lib/message-handler.js');
const Message$570 = require('../lib/message.js');
const Q$571 = require('q');
const id$572 = function () {
        var ix = 0;
        return function () {
            ix += 1;
            return ix;
        };
    }();
const prefix$573 = 'irc.mibbit.net';
const command$574 = 'generic';
const arg1$575 = 'arg1';
const arg2$576 = 'arg2';
const argr$577 = 'rest args';
const raw$578 = format$565(':%s %s %s %s :%s', prefix$573, command$574, arg1$575, arg2$576, argr$577);
describe('Message Parsers', function () {
    var parser$580, receiver$581;
    beforeEach(function () {
        logfn$567();
        receiver$581 = { _id: id$572() };
        parser$580 = MessageHandler$569(receiver$581);
    });
    describe('#parse', function () {
        var retval$585, evtval$586;
        beforeEach(function (done$591) {
            parser$580.on('generic', function (message$592) {
                evtval$586 = message$592;
                done$591();
            });
            retval$585 = parser$580.parse(raw$578);
        });
        it('Return value', function () {
            assert$562(retval$585.prefix === prefix$573);
            assert$562(retval$585.command === command$574);
            assert$562(retval$585.params[0] === arg1$575);
            assert$562(retval$585.params[1] === arg2$576);
            assert$562(retval$585.params[2] === argr$577);
            assert$562(retval$585.receiver === receiver$581);
        });
        it('Event Value', function () {
            assert$562(evtval$586.prefix === prefix$573);
            assert$562(evtval$586.command === command$574);
            assert$562(evtval$586.params[0] === arg1$575);
            assert$562(evtval$586.params[1] === arg2$576);
            assert$562(evtval$586.params[2] === argr$577);
            assert$562(evtval$586.receiver === receiver$581);
        });
        it('Emit and Return value are the same', function () {
            assert$562(retval$585 === evtval$586);
        });
    });
    describe('`*` event', function () {
        it('is called with every function', function (done$594) {
            var count$595 = 0;
            parser$580.on('*', function (message$596) {
                count$595 += 1;
                if (count$595 === 2) {
                    done$594();
                }
            });
            parser$580.parse(raw$578);
            parser$580.parse(raw$578);
        });
    });
});