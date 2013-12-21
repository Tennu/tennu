// These test excpet that Message.spec.js passes all tests.

var CommandParser = require('../lib/command-parser.js');
var Message = require('../lib/message.js');
var NoLogging = require('../lib/null-logger.js');

var messages = {
    noncommand: ":sender!user@localhost PRIVMSG #test :Hello",
    trigger: ":sender!user@localhost PRIVMSG #test :!testcommand",
    highlight: ":sender!user@localhost PRIVMSG #test :testbot: testcommand",
    query: ":sender!user@localhost PRIVMSG testbot :testcommand",
    queryWithTrigger: ":sender!user@localhost PRIVMSG testbot :!testcommand",
    args: ":sender!user@localhost PRIVMSG testbot :testcommand arg1 arg2",
    argsWithOddSpacing: ":sender!user@localhost PRIVMSG testbot :testcommand  arg1   arg2  ",
    highlightWithOddSpacing: ":sender!user@localhost PRIVMSG #test :  testbot:   testcommand   "
};

var prefix = "sender!user@localhost";

describe('CommandParser', function () {
    var parser;
    var nickname = function () { return 'testbot'; };

    beforeEach(function () {
        parser = CommandParser({}, nickname, NoLogging());
    });

    describe("Ignoring non-commands", function () {
        var message = Message(messages.noncommand);

        it("returns undefined for non-commands", function () {
            expect(parser.parse(message)).toBe(undefined);
        });
    });

    describe("Recognition Types:", function () {
        it('Trigger', function () {
            var command = parser.parse(Message(messages.trigger));

            expect(command.command).toBe('testcommand');
            expect(command.args).toEqual([]);
            expect(command.nickname).toBe('sender');
            expect(command.message).toBe('!testcommand');
            expect(command.prefix).toBe(prefix);
        });

        it('Highlights', function () {
            var command = parser.parse(Message(messages.highlight));

            expect(command.command).toBe('testcommand');
            expect(command.args).toEqual([]);
            expect(command.nickname).toBe('sender');
            expect(command.message).toBe('testbot: testcommand');
            expect(command.prefix).toBe(prefix);
        });

        it('Query', function () {
            var command = parser.parse(Message(messages.query));

            expect(command.command).toBe('testcommand');
            expect(command.args).toEqual([]);
            expect(command.nickname).toBe('sender');
            expect(command.message).toBe('testcommand');
            expect(command.prefix).toBe(prefix);
        });

        it('Query with trigger', function () {
            var command = parser.parse(Message(messages.queryWithTrigger));

            expect(command.command).toBe('testcommand');
            expect(command.args).toEqual([]);
            expect(command.nickname).toBe('sender');
            expect(command.message).toBe('!testcommand');
            expect(command.prefix).toBe(prefix);
        });
    });

    describe("'args' property", function () {
        it('is an array of the words of the message', function () {
            var command = parser.parse(Message(messages.args));

            expect(command.command).toBe('testcommand');
            expect(command.args).toEqual(['arg1', 'arg2']);
            expect(command.nickname).toBe('sender');
            expect(command.message).toBe('testcommand arg1 arg2');
            expect(command.prefix).toBe(prefix);
        });
    });

    describe("Odd Spacing:", function () {
        it('Highlight', function () {
            var command = parser.parse(Message(messages.highlightWithOddSpacing));

            expect(command.command).toBe('testcommand');
            expect(command.args).toEqual([]);
            expect(command.nickname).toBe('sender');
            expect(command.params[1]).toBe('  testbot:   testcommand   ');
            expect(command.message).toBe('testbot:   testcommand');
            expect(command.prefix).toBe(prefix);
            expect(command.channel).toBe('#test');
            expect(command.isQuery).toBe(false);
        });

        it('Args', function () {
            var command = parser.parse(Message(messages.argsWithOddSpacing));

            expect(command.command).toBe('testcommand');
            expect(command.args).toEqual(['arg1', 'arg2']);
            expect(command.nickname).toBe('sender');
            expect(command.params[0]).toBe('testbot');
            expect(command.params[1]).toBe('testcommand  arg1   arg2  ');
            expect(command.message).toBe('testcommand  arg1   arg2');
            expect(command.prefix).toBe(prefix);
            expect(command.channel).toBe('sender');
            expect(command.isQuery).toBe(true);
        })
    })
});