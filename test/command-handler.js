const sinon = require('sinon');
const assert = require('better-assert');
const equal = require('deep-eql');
const inspect = require('util').inspect;
const format = require('util').format;
const debug = false;
const logfn = debug ? console.log.bind(console) : function () {
    };
const logger = {
        debug: logfn,
        info: logfn,
        notice: logfn,
        warn: logfn,
        error: logfn
    };
const CommandHandler = require('../lib/command-handler.js');
const Message = require('../lib/message.js');
const Promise = require('bluebird');
const config = { 'command-trigger': '!' };
const prefix = 'sender!user@localhost';
const commandname = 'command';
const channel = '#test';
const sender = 'sender';
const nickname = 'testbot';
const arg1 = 'arg-1';
const arg2 = 'arg-2';
const nicknamefn = function () {
    return nickname;
};
const chanmsg = function (message) {
    return format(format(':%s PRIVMSG %s :%s', prefix, channel, message));
};
const privmsg = function (message) {
    return format(format(':%s PRIVMSG %s :%s', prefix, nickname, message));
};
const messages = {
        noncommand: chanmsg('hello'),
        command: privmsg(format('%s', commandname)),
        detect: {
            trigger: chanmsg(format('!%s', commandname)),
            highlight: chanmsg(format('%s: %s', nickname, commandname)),
            case_insensitive_highlight: chanmsg(format('%s: %s', nickname.toUpperCase(), commandname)),
            query: privmsg(format('%s', commandname)),
            query_with_trigger: privmsg(format('!%s', commandname)),
            highlight_oddspacing: chanmsg(format('  %s:   %s   ', nickname, commandname))
        },
        args: privmsg(format('%s %s %s', commandname, arg1, arg2)),
        args_oddspacing: privmsg(format('%s  %s   %s  ', commandname, arg1, arg2))
    };
describe('Command Handler', function () {
    var handler, receiver;
    beforeEach(function () {
        receiver = { say: sinon.spy() };
        handler = CommandHandler(config, receiver, nicknamefn, logger);
    });
    describe('command detection:', function () {
        it('ignores non-commands by returning undefined', function () {
            const message = Message(messages.noncommand);
            assert(handler.parse(message) === undefined);
        });
        describe('Recognition Types:', function () {
            it('Trigger', function () {
                const command = handler.parse(Message(messages.detect.trigger));
                assert(command.command === commandname);
                assert(equal(command.args, []));
            });
            it('Highlights', function () {
                const command = handler.parse(Message(messages.detect.highlight));
                assert(command.command === commandname);
                assert(equal(command.args, []));
            });
            it('Highlights in case insensitive way', function () {
                const command = handler.parse(Message(messages.detect.case_insensitive_highlight));
                assert(command.command === commandname);
                assert(equal(command.args, []));
            });
            it('Query', function () {
                const command = handler.parse(Message(messages.detect.query));
                assert(command.command === commandname);
                assert(equal(command.args, []));
            });
            it('Query with trigger', function () {
                const command = handler.parse(Message(messages.detect.query_with_trigger));
                assert(command.command === commandname);
                assert(equal(command.args, []));
            });
        });
        it('"args" property an array of the words of the message', function () {
            const command = handler.parse(Message(messages.args));
            assert(command.command === commandname);
            assert(equal(command.args, [
                arg1,
                arg2
            ]));
        });
        describe('Odd Spacing:', function () {
            it('Highlight', function () {
                const command = handler.parse(Message(messages.detect.highlight_oddspacing));
                assert(command.command === commandname);
                assert(equal(command.args, []));
            });
            it('Args', function () {
                const command = handler.parse(Message(messages.args_oddspacing));
                assert(command.command === commandname);
                assert(equal(command.args, [
                    arg1,
                    arg2
                ]));
            });
        });
        describe('events are emitted', function () {
            it('of the command name', function (done) {
                handler.on(commandname, function (command) {
                    assert(command.command === commandname);
                    done();
                });
                handler.parse(Message(messages.command));
            });
        });
    });
    describe('Response handling', function () {
        it('no response', function (done) {
            handler.after(function () {
                try {
                    logfn('After function called.');
                    assert(!receiver.say.called);
                    done();
                } catch (e) {
                    done(e);
                }
            });
            handler.on(commandname, function () {
                return undefined;
            });
            handler.parse(Message(messages.command));
        });
        it('string response', function (done) {
            receiver.say = function (_sender, response) {
                try {
                    assert(sender === _sender);
                    assert(response === 'response');
                    assert(arguments.length === 2);
                    done();
                } catch (e) {
                    done(e);
                }
            };
            handler.on(commandname, function () {
                return 'response';
            });
            handler.parse(Message(messages.command, receiver));
        });
        it('[string] response', function (done) {
            receiver.say = function (_sender, response) {
                try {
                    assert(sender === _sender);
                    assert(equal(response, ['response']));
                    assert(arguments.length === 2);
                    done();
                } catch (e) {
                    done(e);
                }
            };
            handler.on(commandname, function () {
                return ['response'];
            });
            handler.parse(Message(messages.command, receiver));
        });
        it('Promise<string> response', function (done) {
            receiver.say = function (_sender, response) {
                try {
                    assert(sender === _sender);
                    assert(response === 'response');
                    assert(arguments.length === 2);
                    done();
                } catch (e) {
                    done(e);
                }
            };
            handler.on(commandname, function () {
                return Promise.resolve('response');
            });
            handler.parse(Message(messages.command, receiver));
        });
        it('Promise<[string]> response', function (done) {
            receiver.say = function (_sender, response) {
                try {
                    assert(sender === _sender);
                    assert(equal(response, ['response']));
                    assert(arguments.length === 2);
                    done();
                } catch (e) {
                    done(e);
                }
            };
            handler.on(commandname, function () {
                return Promise.resolve(['response']);
            });
            handler.parse(Message(messages.command, receiver));
        });
        it('Promise<string> after Promise#catch()', function (done) {
            const failHandler = function (command) {
                return Promise.reject(new Error()).catch(function (err) {
                    console.log('Returning sorry!');
                    return 'Sorry!';
                });
            };
            receiver.say = function (sender$2, response) {
                try {
                    assert(response === 'Sorry!');
                    done();
                } catch (e) {
                    done(e);
                }
            };
            handler.on(commandname, failHandler);
            handler.parse(Message(messages.command, receiver));
        });
    });
});