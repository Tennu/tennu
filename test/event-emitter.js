const sinon$519 = require('sinon');
const assert$520 = require('better-assert');
const equal$521 = require('deep-eql');
const inspect$522 = require('util').inspect;
const format$523 = require('util').format;
const debug$524 = false;
const logfn$525 = debug$524 ? console.log.bind(console) : function () {
    };
const EventEmiter$526 = require('../lib/event-emitter.js');
describe('After Event Emitter', function () {
    var EE$528;
    beforeEach(function () {
        logfn$525();
        EE$528 = EventEmiter$526();
    });
    it('works as an event emitter.', function (done$533) {
        EE$528.on('x', function (arg1$534, arg2$535) {
            assert$520(arg1$534 === true);
            assert$520(arg2$535 === false);
            done$533();
        });
        EE$528.emit('x', true, false);
    });
    it('does not throw on non-existent events.', function (done$536) {
        EE$528.emit('y');
        done$536();
    });
    describe('#after', function () {
        it('takes a function, which it calls after the listener returns.', function (done$539) {
            EE$528.on('x', function () {
                return true;
            });
            EE$528.after(function (err$540, res$541, emitted$542, arg1$543, arg2$544) {
                assert$520(err$540 === undefined);
                assert$520(res$541 === true);
                assert$520(emitted$542 === 'x');
                assert$520(arg1$543 === true);
                assert$520(arg2$544 === false);
                done$539();
            });
            EE$528.emit('x', true, false);
        });
        it('passes the error to err if an error is thrown', function (done$545) {
            const error$546 = new Error();
            EE$528.on('x', function () {
                throw error$546;
            });
            EE$528.after(function (err$547, res$548, emitted$549) {
                assert$520(err$547 === error$546);
                assert$520(res$548 === undefined);
                done$545();
            });
            EE$528.emit('x');
        });
    });
});