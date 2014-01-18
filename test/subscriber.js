const sinon = require('sinon');
const assert = require('better-assert');
const equal = require('deep-eql');
const inspect = require('util').inspect;
const format = require('util').format;
const debug = false;
const logfn = debug ? console.log.bind(console) : function () {
    };
const BiSubscriber = require('../lib/bisubscriber');
const EventEmitter = require('events').EventEmitter;
describe('BiSubscribers', function () {
    var subscriber, primary, secondary;
    beforeEach(function () {
        logfn();
        primary = new EventEmitter();
        secondary = new EventEmitter();
        subscriber = new BiSubscriber(primary, secondary);
    });
    describe('subscribe events to two event emitters', function () {
        var primarySpy, secondarySpy;
        beforeEach(function () {
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
            const primaryDataSpy = sinon.spy();
            const secondaryDataSpy = sinon.spy();
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
        var spy;
        beforeEach(function () {
            spy = sinon.spy();
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
    describe('unsubscribing', function () {
        var spy;
        beforeEach(function () {
            spy = sinon.spy();
        });
        it('primary w/two arg version', function () {
            subscriber.on('event', spy);
            primary.emit('event');
            subscriber.off('event', spy);
            primary.emit('event');
            assert(spy.calledOnce);
        });
        it('primary w/object version', function () {
            subscriber.on('event', spy);
            subscriber.on('event2', spy);
            primary.emit('event2');
            subscriber.off({
                'event': spy,
                'event2': spy
            });
            primary.emit('event');
            primary.emit('event2');
            assert(spy.calledOnce);
        });
    });
});