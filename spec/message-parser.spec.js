var events = require('events');
var util = require('util');
var id = require('./id');

var MessageParser = require('../lib/message-parser');
var ChunkedMessageParser = require('../lib/chunked-message-parser');
var Message = require('../lib/structures/message');

jasmine.DEFAULT_TIMEOUT_INTERVAL = 500; //ms

describe('Message Parsers', function () {
    var mp, receiver;
    var input = ':concrete.mozilla.org 432 Havvy :Erroneous Nickname: Illegal characters';

    describe("parse messages", function () {
        beforeEach(function () {
            receiver = {_id: id()};
            mp = new MessageParser(receiver);
        });

        it('and returns them', function () {
            var msg = mp.parse(input);
            expect(msg).toEqual(new Message(input, receiver));
        });

        it('and emit them by their name', function () {
            var msg, done = false;

            runs(function () {
                mp.on('432', function (m) {
                    done = true;
                    msg = m;
                });

                mp.parse(input);
            });

            waitsFor(function () { return done; }, "432 message is parsed.");

            runs(function () {
                expect(msg instanceof Message).toBeTruthy();
                expect(msg.name).toBe('432');
                expect(msg.args[0]).toBe('Havvy');
                expect(msg.args[1]).toBe('Erroneous Nickname: Illegal characters');
                expect(msg.receiver).toBe(receiver);
            });
        });

        it('and emits all messages under _message', function () {
            var count = 0;

            runs(function () {
                mp.on("_message", function (message) {
                    count++;
                });

                mp.parse(input);
                mp.parse(input);
            });

            waitsFor(function () { return count === 2; }, "events captures", 2);

            runs(function () {
                expect(count).toBe(2);
            });
        });
    });
});

describe('ChunkedMessageParsers', function () {
    var msg, mp, cmp, rcvr;

    beforeEach(function () {
        rcvr = {_id: id()};
        mp = new MessageParser(rcvr);
        cmp = new ChunkedMessageParser(mp);
    });

    it('relay unknown messages as a message handler', function () {
        var msg, done;

        runs(function () {
            cmp.on('unknown', function (m) {
                done = true;
                msg = m;
            });

            mp.parse(':server.network.net UNKNOWN testbot :An unknown message');
        });

        waitsFor(function () { return done; }, "unkown message received");

        runs(function () {
            expect(msg.name).toBe("unknown");
            expect(msg.receiver).toBe(rcvr);
            expect(msg.args[0]).toBe('testbot');
        });
    });
});
