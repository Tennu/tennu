const sinon = require('sinon');
const assert = require('better-assert');
const equal = require('deep-eql');
const inspect = require('util').inspect;
const format = require('util').format;

const debug = false;
const logfn = debug ? console.log.bind(console) : function () {};

const BiSubscriber = require('../lib/bisubscriber');
const EventEmitter = require('events').EventEmitter;

describe 'BiSubscribers' {
    beforeEach {
        logfn(/* newline */);
    }

    describe 'subscribe events to two event emitters' {
        var subscriber, primary, secondary, primarySpy, secondarySpy;

        beforeEach {
            primary = new EventEmitter();
            secondary = new EventEmitter();
            subscriber = new BiSubscriber(primary, secondary);

            primarySpy = sinon.spy();
            secondarySpy = sinon.spy();
        }

        it 'treats most events as primary events' {
            subscriber.on('event', primarySpy);
            primary.emit('event');

            assert(primarySpy.called);
            assert(!secondarySpy.called);
        }

        it 'treats events starting with "!" to be secondary' {
            subscriber.on('!event', secondarySpy);
            secondary.emit('event');

            assert(!primarySpy.called);
            assert(secondarySpy.called);
        }

        it 'can subscribe multiple events' {
            var primaryDataSpy, secondaryDataSpy;

            primaryDataSpy = sinon.spy();
            secondaryDataSpy = sinon.spy();

            subscriber.on({
                'event': primarySpy,
                '!event': secondarySpy,
                'data': primaryDataSpy,
                '!data': secondaryDataSpy
            });

            primary.emit('event');

            assert(primarySpy.called);
            assert(!secondarySpy.called);

            secondary.emit('data');

            assert(!primaryDataSpy.called);
            assert(secondaryDataSpy.called);
        }
    }

    describe 'quantification (on vs. once)' {
        var subscriber, primary, secondary, spy, eventCount, isDone;

        beforeEach {
            primary = new EventEmitter();
            secondary = new EventEmitter();
            subscriber = new BiSubscriber(primary, secondary, null);
            spy = sinon.spy();
            eventCount = 0;

            subscriber.on('event !event', function () {
                eventCount += 1;
            });
        }

        it 'handles once one time (primary)' {
            subscriber.once('event', spy);

            primary.emit('event');
            primary.emit('event');

            assert(spy.calledOnce);
        }

        it 'handles once one time (secondary)' {
            subscriber.once('!event', spy);

            secondary.emit('event');
            secondary.emit('event');

            assert(spy.calledOnce);
        }

        it 'handles on multiple times' {
            subscriber.on('event', spy);

            primary.emit('event');
            primary.emit('event');

            assert(spy.calledTwice);
        }

        it 'handles once one time' {
            subscriber.on('!event', spy);

            secondary.emit('event');
            secondary.emit('event');

            assert(spy.calledTwice);
        }
    }
}