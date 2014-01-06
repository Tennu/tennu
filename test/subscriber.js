const sinon = require('sinon');
const assert = require('better-assert');
const equal = require('deep-eql');
const inspect = require('util').inspect;
const format = require('util').format;

const debug = false;
const logfn = debug ? console.log.bind(console) : function () {};

const BiSubscriber = require('../lib/bisubscriber');
const EventEmitter = require('events').EventEmitter;

describe('BiSubscribers', function () {
    beforeEach(function () {
        logfn(/* newline */);
    });

    describe('subscribe events to two event emitters', function () {
        var subscriber, primary, secondary, primarySpy, secondarySpy;

        beforeEach(function () {
            primary = new EventEmitter();
            secondary = new EventEmitter();
            subscriber = new BiSubscriber(primary, secondary);

            primarySpy = sinon.spy();
            secondarySpy = sinon.spy();
        });

        it('treats most events as primary events', function () {
            subscriber.on('event', primarySpy);
            primary.emit('event');

            assert(primarySpy.called);
            assert(!secondarySpy.called);
        });

        it('treats events starting with "!" to be secondary', function () {
                subscriber.on('!event', secondarySpy);
                secondary.emit('event');

            assert(!primarySpy.called);
            assert(secondarySpy.called);
        });

        it('can subscribe multiple events', function () {
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
        });
    });

    describe('quantification (on vs. once)', function () {
        var subscriber, primary, secondary, spy, eventCount, isDone;

        beforeEach(function () {
            primary = new EventEmitter();
            secondary = new EventEmitter();
            subscriber = new BiSubscriber(primary, secondary, null);
            spy = sinon.spy();
            eventCount = 0;

            subscriber.on('event !event', function () {
                eventCount += 1;
            });
        });

        it('handles once one time (primary)', function () {
            subscriber.once('event', spy);

            primary.emit('event');
            primary.emit('event');

            assert(spy.calledOnce);
        });

        it('handles once one time (secondary)', function () {
            subscriber.once('!event', spy);

            secondary.emit('event');
            secondary.emit('event');

            assert(spy.calledOnce);
        });

        it('handles on multiple times', function () {
            subscriber.on('event', spy);

            primary.emit('event');
            primary.emit('event');

            assert(spy.calledTwice);
        });

        it('handles once one time', function () {
            subscriber.on('!event', spy);

            secondary.emit('event');
            secondary.emit('event');

            assert(spy.calledTwice);
        });
    });
});