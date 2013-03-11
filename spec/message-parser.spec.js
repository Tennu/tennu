var events = require('events');

var MessageHandler = require('../lib/message-parser');
var Message = require('../lib/structures/message');

describe('Message Handlers', function () {
    var emitter, mh, receiver;

    beforeEach(function () {
        emitter = new events.EventEmitter();
        receiver = {_:1};
        mh = new MessageHandler(receiver, emitter);
    });

    it('convert IRC to Messages', function () {
        var msg, done = false;

        runs(function () {
            mh.on('432', function (m) {
                done = true;
                msg = m;
            });

            emitter.emit('data', ':concrete.mozilla.org 432 Havvy[telnet] :Erroneous Nickname: Illegal characters');
        });

        waitsFor(function () { return done; }, "432 message is parsed.");

        runs(function () {
            expect(msg instanceof Message).toBeTruthy();
            expect(msg.name).toBe('432');
            expect(msg.args[0]).toBe('Havvy[telnet]');
            expect(msg.args[1]).toBe('Erroneous Nickname: Illegal characters');
            expect(msg.receiver).toBe(receiver);
        });
    });

    it('emits all messages under _message', function () {
        var msg, count = 0;

        runs(function () {
            mh.on("_message", function (message) {
                count++;
            });

            emitter.emit('data', ':concrete.mozilla.org 432 Havvy[telnet] :Erroneous Nickname: Illegal characters');
            emitter.emit('data', ':concrete.mozilla.org 432 Havvy[telnet] :Erroneous Nickname: Illegal characters');
        });

        waitsFor(function () { return count === 2; }, "events captures", 2);

        runs(function () {
            expect(count).toBe(2);
        });
    });
});
