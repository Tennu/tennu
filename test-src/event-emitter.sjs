const sinon = require('sinon');
const assert = require('better-assert');
const equal = require('deep-eql');
const inspect = require('util').inspect;
const format = require('util').format;

const debug = false;
const logfn = debug ? console.log.bind(console) : function () {};

const EventEmiter = require('../lib/event-emitter.js');

describe 'After Event Emitter' {
    var EE;

    beforeEach {
        logfn(/* newline */);
        EE = EventEmiter();
    }

    it 'works as an event emitter.' (done) {
        EE.on('x', function (arg1, arg2) { 
            assert(arg1 === true);
            assert(arg2 === false);
            done()
        });

        EE.emit('x', true, false);
    }

    it 'does not throw on non-existent events.' (done) {
        EE.emit('y');
        done();
    }

    describe '#after' {
        it 'takes a function, which it calls after the listener returns.' (done) {
            EE.on('x', function () {return true;});
            EE.after(function (err, res, emitted, arg1, arg2) {
                assert(err === undefined);
                assert(res === true);
                assert(emitted === 'x');
                assert(arg1 === true);
                assert(arg2 === false);
                done();
            });
            EE.emit('x', true, false);
        }

        it 'passes the error to err if an error is thrown' (done) {
            const error = new Error();
            EE.on('x', function () {throw error});
            EE.after(function (err, res, emitted) {
                assert(err === error);
                assert(res === undefined);
                done();
            });
            EE.emit('x');
        }
    }
}