var events = require('events');
var util = require('util');

var BiSubscriber = require('../lib/bisubscriber');

describe('BiSubscribers', function () {
    describe("bisubscribers subscribe events to two event emitters", function () {
        var primary, secondary, subscriber, spy1, spy2;

        beforeEach(function () {
            primary = new events.EventEmitter();
            secondary = new events.EventEmitter();
            subscriber = new BiSubscriber(primary, secondary);
            spy1 = jasmine.createSpy("primary-event");
            spy2 = jasmine.createSpy("secondary-event");
        });

        it('treats most events as primary events', function () {
            runs(function () {
                subscriber.on("event", spy1);
                primary.emit("event");
            });

            waitsFor(function() {
                return spy1.wasCalled;
            }, "spy1 was called", 200);

            runs(function () {
                expect(spy1).toHaveBeenCalled(); // Redundant
                expect(spy2).not.toHaveBeenCalled();
            });
        });

        it("treats events starting with '!' to be secondary", function () {
            runs(function () {
                subscriber.on("!event", spy2);
                secondary.emit("event");
            });

            waitsFor(function () {
                return spy2.wasCalled;
            }, "spy2 is called", 200);

            runs(function() {
                expect(spy1).not.toHaveBeenCalled();
                expect(spy2).toHaveBeenCalled(); // Redundant
            });
        });

        it("can subscribe multiple events", function () {
            var spy3, spy4;

            runs(function () {
                spy3 = jasmine.createSpy("primary-data");
                spy4 = jasmine.createSpy("secondary-data");

                subscriber.on({
                    "event": spy1,
                    "!event": spy2,
                    "data": spy3,
                    "!data": spy4
                });

                primary.emit("event");
            });

            waitsFor(function () {
                return spy1.wasCalled;
            }, "spy1 was called", 200);

            runs(function () {

            expect(spy1).toHaveBeenCalled(); // redundant
            expect(spy2).not.toHaveBeenCalled();

            secondary.emit("data");
        });

            waitsFor(function () {
                return spy4.wasCalled;
            }, "spy4 was called", 200);

            runs(function () {
                expect(spy3).not.toHaveBeenCalled();
                expect(spy4).toHaveBeenCalled(); // redundant
            });
        });
    });

describe("quantification (on vs. once)", function () {
    var subscriber, primary, secondary, spy, eventCount, isDone;

    isDone = function () {
        return eventCount == 2;
    };

    beforeEach(function () {
        primary = new events.EventEmitter();
        secondary = new events.EventEmitter();
        subscriber = new BiSubscriber(primary, secondary, null);
        spy = jasmine.createSpy();
        eventCount = 0;

        subscriber.on("event !event", function () {
            eventCount += 1;
        });
    });

    it("handles once one time (primary)", function () {
        runs(function () {
            subscriber.once("event", spy);

            primary.emit("event");
            primary.emit("event");
        });

        waitsFor(isDone, "event fired twice", 200);

        runs(function () {
            expect(spy.calls.length).toEqual(1);
        });
    });

    it("handles once one time (secondary)", function () {
        runs(function () {
            subscriber.once("!event", spy);

            secondary.emit("event");
            secondary.emit("event");
        });

        waitsFor(isDone, "event fired twice", 200);

        runs(function () {
            expect(spy.calls.length).toEqual(1);
        });
    });

    it("handles on multiple times", function () {
        runs(function () {
            subscriber.on("event", spy);

            primary.emit("event");
            primary.emit("event");
        });

        waitsFor(isDone, "event fired twice", 200);

        runs(function () {
            expect(spy.calls.length).toEqual(2);
        });
    });

    it("handles once one time", function () {
        runs(function () {
            subscriber.on("!event", spy);

            secondary.emit("event");
            secondary.emit("event");
        });

        waitsFor(isDone, "event fired twice", 200);

        runs(function () {
            expect(spy.calls.length).toEqual(2);
        });
    });
});
});