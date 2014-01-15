const sinon$760 = require('sinon');
const assert$761 = require('better-assert');
const equal$762 = require('deep-eql');
const inspect$763 = require('util').inspect;
const format$764 = require('util').format;
const debug$765 = false;
const logfn$766 = debug$765 ? console.log.bind(console) : function () {
    };
const BiSubscriber$767 = require('../lib/bisubscriber');
const EventEmitter$768 = require('events').EventEmitter;
describe('BiSubscribers', function () {
    beforeEach(function () {
        logfn$766();
    });
    describe('subscribe events to two event emitters', function () {
        var subscriber$773, primary$774, secondary$775, primarySpy$776, secondarySpy$777;
        beforeEach(function () {
            primary$774 = new EventEmitter$768();
            secondary$775 = new EventEmitter$768();
            subscriber$773 = new BiSubscriber$767(primary$774, secondary$775);
            primarySpy$776 = sinon$760.spy();
            secondarySpy$777 = sinon$760.spy();
        });
        it('treats most events as primary events', function () {
            subscriber$773.on('event', primarySpy$776);
            primary$774.emit('event');
            assert$761(primarySpy$776.called);
            assert$761(!secondarySpy$777.called);
        });
        it('treats events starting with "!" to be secondary', function () {
            subscriber$773.on('!event', secondarySpy$777);
            secondary$775.emit('event');
            assert$761(!primarySpy$776.called);
            assert$761(secondarySpy$777.called);
        });
        it('can subscribe multiple events', function () {
            var primaryDataSpy$782, secondaryDataSpy$783;
            primaryDataSpy$782 = sinon$760.spy();
            secondaryDataSpy$783 = sinon$760.spy();
            subscriber$773.on({
                'event': primarySpy$776,
                '!event': secondarySpy$777,
                'data': primaryDataSpy$782,
                '!data': secondaryDataSpy$783
            });
            primary$774.emit('event');
            assert$761(primarySpy$776.called);
            assert$761(!secondarySpy$777.called);
            secondary$775.emit('data');
            assert$761(!primaryDataSpy$782.called);
            assert$761(secondaryDataSpy$783.called);
        });
    });
    describe('quantification (on vs. once)', function () {
        var subscriber$784, primary$785, secondary$786, spy$787, eventCount$788, isDone$789;
        beforeEach(function () {
            primary$785 = new EventEmitter$768();
            secondary$786 = new EventEmitter$768();
            subscriber$784 = new BiSubscriber$767(primary$785, secondary$786, null);
            spy$787 = sinon$760.spy();
            eventCount$788 = 0;
            subscriber$784.on('event !event', function () {
                eventCount$788 += 1;
            });
        });
        it('handles once one time (primary)', function () {
            subscriber$784.once('event', spy$787);
            primary$785.emit('event');
            primary$785.emit('event');
            assert$761(spy$787.calledOnce);
        });
        it('handles once one time (secondary)', function () {
            subscriber$784.once('!event', spy$787);
            secondary$786.emit('event');
            secondary$786.emit('event');
            assert$761(spy$787.calledOnce);
        });
        it('handles on multiple times', function () {
            subscriber$784.on('event', spy$787);
            primary$785.emit('event');
            primary$785.emit('event');
            assert$761(spy$787.calledTwice);
        });
        it('handles once one time', function () {
            subscriber$784.on('!event', spy$787);
            secondary$786.emit('event');
            secondary$786.emit('event');
            assert$761(spy$787.calledTwice);
        });
    });
});