const sinon$545 = require('sinon');
const assert$546 = require('better-assert');
const equal$547 = require('deep-eql');
const inspect$548 = require('util').inspect;
const format$549 = require('util').format;
const debug$550 = false;
const logfn$551 = debug$550 ? console.log.bind(console) : function () {
    };
const EventEmiter$552 = require('../lib/event-emitter.js');
describe('After Event Emitter', function () {
    var EE$554;
    beforeEach(function () {
        logfn$551();
        EE$554 = EventEmiter$552();
    });
    it('works as an event emitter.', function (done$559) {
        EE$554.on('x', function (arg1$560, arg2$561) {
            assert$546(arg1$560 === true);
            assert$546(arg2$561 === false);
            done$559();
        });
        EE$554.emit('x', true, false);
    });
    it('does not throw on non-existent events.', function (done$562) {
        EE$554.emit('y');
        done$562();
    });
    describe('#after', function () {
        it('takes a function, which it calls after the listener returns.', function (done$565) {
            EE$554.on('x', function () {
                return true;
            });
            EE$554.after(function (err$566, res$567, emitted$568, arg1$569, arg2$570) {
                assert$546(err$566 === undefined);
                assert$546(res$567 === true);
                assert$546(emitted$568 === 'x');
                assert$546(arg1$569 === true);
                assert$546(arg2$570 === false);
                done$565();
            });
            EE$554.emit('x', true, false);
        });
        it('passes the error to err if an error is thrown', function (done$571) {
            const error$572 = new Error();
            EE$554.on('x', function () {
                throw error$572;
            });
            EE$554.after(function (err$573, res$574, emitted$575) {
                assert$546(err$573 === error$572);
                assert$546(res$574 === undefined);
                done$571();
            });
            EE$554.emit('x');
        });
    });
});