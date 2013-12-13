var id = require('./id');

var MessageParser = require('../lib/message-parser');

// jasmine.DEFAULT_TIMEOUT_INTERVAL = 500; //ms

describe('Message Parsers', function () {
    var parser, receiver;
    var input = ':irc.server.net 432 MyNick :Erroneous Nickname: Illegal characters';

    it('has has EventEmitter methods', function () {
        parser = MessageParser({_id: id()});

        expect(parser.on).toBeDefined();
        expect(parser.once).toBeDefined();
        expect(parser.then).toBeDefined();
        expect(parser.emit).toBeDefined();
    });

    describe(".parse Method", function () {
        var ret, msg;

        beforeEach(function (done) {
            receiver = {_id: id()};
            parser = new MessageParser(receiver);

            parser.on('432', function (_msg) {
                msg = _msg;
                done();
            });

            ret = parser.parse(input);
        });

        afterEach(function () {
            ret = undefined;
            msg = undefined;
        });

        it('Return value', function () {
            expect(msg.command).toBe('432');
            expect(msg.params[0]).toBe('MyNick');
            expect(msg.params[1]).toBe('Erroneous Nickname: Illegal characters');
            expect(msg.receiver).toBe(receiver);
        });

        it('Emit Value', function () {
            expect(msg.command).toBe('432');
            expect(msg.params[0]).toBe('MyNick');
            expect(msg.params[1]).toBe('Erroneous Nickname: Illegal characters');
            expect(msg.receiver).toBe(receiver);
        });

        it('Emit and Return value are the same', function () {
            expect(msg).toBe(ret);
        });
    });

    describe('`*` event', function () {
        it('is called with every function', function (done) {
            var count = 0;

            parser.on('*', function (msg) {
                count++;
                if (count === 2) { done(); }
            });

            parser.parse(input);
            parser.parse(input);
        });
    });
});
