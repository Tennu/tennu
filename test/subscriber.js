const sinon$802 = require('sinon');
const assert$803 = require('better-assert');
const equal$804 = require('deep-eql');
const inspect$805 = require('util').inspect;
const format$806 = require('util').format;
const debug$807 = false;
const logfn$808 = debug$807 ? console.log.bind(console) : function () {
    };
const BiSubscriber$809 = require('../lib/bisubscriber');
const EventEmitter$810 = require('events').EventEmitter;
describe('BiSubscribers', function () {
    beforeEach(function () {
        logfn$808();
    });
    describe('subscribe events to two event emitters', function () {
        var subscriber$815, primary$816, secondary$817, primarySpy$818, secondarySpy$819;
        beforeEach(function () {
            primary$816 = new EventEmitter$810();
            secondary$817 = new EventEmitter$810();
            subscriber$815 = new BiSubscriber$809(primary$816, secondary$817);
            primarySpy$818 = sinon$802.spy();
            secondarySpy$819 = sinon$802.spy();
        });
        it('treats most events as primary events', function () {
            subscriber$815.on('event', primarySpy$818);
            primary$816.emit('event');
            assert$803(primarySpy$818.called);
            assert$803(!secondarySpy$819.called);
        });
        it('treats events starting with "!" to be secondary', function () {
            subscriber$815.on('!event', secondarySpy$819);
            secondary$817.emit('event');
            assert$803(!primarySpy$818.called);
            assert$803(secondarySpy$819.called);
        });
        it('can subscribe multiple events', function () {
            var primaryDataSpy$824, secondaryDataSpy$825;
            primaryDataSpy$824 = sinon$802.spy();
            secondaryDataSpy$825 = sinon$802.spy();
            subscriber$815.on({
                'event': primarySpy$818,
                '!event': secondarySpy$819,
                'data': primaryDataSpy$824,
                '!data': secondaryDataSpy$825
            });
            primary$816.emit('event');
            assert$803(primarySpy$818.called);
            assert$803(!secondarySpy$819.called);
            secondary$817.emit('data');
            assert$803(!primaryDataSpy$824.called);
            assert$803(secondaryDataSpy$825.called);
        });
    });
    describe('quantification (on vs. once)', function () {
        var subscriber$826, primary$827, secondary$828, spy$829, eventCount$830, isDone$831;
        beforeEach(function () {
            primary$827 = new EventEmitter$810();
            secondary$828 = new EventEmitter$810();
            subscriber$826 = new BiSubscriber$809(primary$827, secondary$828, null);
            spy$829 = sinon$802.spy();
            eventCount$830 = 0;
            subscriber$826.on('event !event', function () {
                eventCount$830 += 1;
            });
        });
        it('handles once one time (primary)', function () {
            subscriber$826.once('event', spy$829);
            primary$827.emit('event');
            primary$827.emit('event');
            assert$803(spy$829.calledOnce);
        });
        it('handles once one time (secondary)', function () {
            subscriber$826.once('!event', spy$829);
            secondary$828.emit('event');
            secondary$828.emit('event');
            assert$803(spy$829.calledOnce);
        });
        it('handles on multiple times', function () {
            subscriber$826.on('event', spy$829);
            primary$827.emit('event');
            primary$827.emit('event');
            assert$803(spy$829.calledTwice);
        });
        it('handles once one time', function () {
            subscriber$826.on('!event', spy$829);
            secondary$828.emit('event');
            secondary$828.emit('event');
            assert$803(spy$829.calledTwice);
        });
    });
});