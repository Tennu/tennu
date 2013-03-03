var events = require('events');

var MessageHandler = require('../lib/irc-message-emitter');

describe('Message Handlers', function () {
    var emitter, mh, receiver;

    beforeEach(function () {
        emitter = new events.EventEmitter();
        receiver = {};
        mh = new MessageHandler(emitter, {}, receiver);
    });

    it('does something', function () {
        expect(true).toBe(true);
    });
});