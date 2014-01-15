const sinon$374 = require('sinon');
const assert$375 = require('better-assert');
const equal$376 = require('deep-eql');
const inspect$377 = require('util').inspect;
const format$378 = require('util').format;
const debug$379 = false;
const logfn$380 = debug$379 ? console.log.bind(console) : function () {
    };
const logger$381 = {
        debug: logfn$380,
        info: logfn$380,
        notice: logfn$380,
        warn: logfn$380,
        error: logfn$380
    };
const CommandHandler$382 = require('../lib/command-handler.js');
const Message$383 = require('../lib/message.js');
const Q$384 = require('q');
const config$385 = { trigger: '!' };
const prefix$386 = 'sender!user@localhost';
const commandname$387 = 'command';
const channel$388 = '#test';
const sender$389 = 'sender';
const nickname$390 = 'testbot';
const arg1$391 = 'arg-1';
const arg2$392 = 'arg-2';
const nicknamefn$393 = function () {
    return nickname$390;
};
const chanmsg$394 = function (message) {
    return format$378(format$378(':%s PRIVMSG %s :%s', prefix$386, channel$388, message));
};
const privmsg$395 = function (message) {
    return format$378(format$378(':%s PRIVMSG %s :%s', prefix$386, nickname$390, message));
};
const messages$396 = {
        noncommand: chanmsg$394('hello'),
        command: privmsg$395(format$378('%s', commandname$387)),
        detect: {
            trigger: chanmsg$394(format$378('!%s', commandname$387)),
            highlight: chanmsg$394(format$378('%s: %s', nickname$390, commandname$387)),
            query: privmsg$395(format$378('%s', commandname$387)),
            query_with_trigger: privmsg$395(format$378('!%s', commandname$387)),
            highlight_oddspacing: chanmsg$394(format$378('  %s:   %s   ', nickname$390, commandname$387))
        },
        args: privmsg$395(format$378('%s %s %s', commandname$387, arg1$391, arg2$392)),
        args_oddspacing: privmsg$395(format$378('%s  %s   %s  ', commandname$387, arg1$391, arg2$392))
    };
describe('Command Handler', function () {
    var handler$398;
    beforeEach(function () {
        handler$398 = CommandHandler$382(config$385, nicknamefn$393, logger$381);
    });
    describe('command detection:', function () {
        it('ignores non-commands by returning undefined', function () {
            const message$407 = Message$383(messages$396.noncommand);
            assert$375(handler$398.parse(message$407) === undefined);
        });
        describe('Recognition Types:', function () {
            it('Trigger', function () {
                const command$412 = handler$398.parse(Message$383(messages$396.detect.trigger));
                assert$375(command$412.command === commandname$387);
                assert$375(equal$376(command$412.args, []));
            });
            it('Highlights', function () {
                const command$413 = handler$398.parse(Message$383(messages$396.detect.highlight));
                assert$375(command$413.command === commandname$387);
                assert$375(equal$376(command$413.args, []));
            });
            it('Query', function () {
                const command$414 = handler$398.parse(Message$383(messages$396.detect.query));
                assert$375(command$414.command === commandname$387);
                assert$375(equal$376(command$414.args, []));
            });
            it('Query with trigger', function () {
                const command$415 = handler$398.parse(Message$383(messages$396.detect.query_with_trigger));
                assert$375(command$415.command === commandname$387);
                assert$375(equal$376(command$415.args, []));
            });
        });
        it('"args" property an array of the words of the message', function () {
            const command$416 = handler$398.parse(Message$383(messages$396.args));
            assert$375(command$416.command === commandname$387);
            assert$375(equal$376(command$416.args, [
                arg1$391,
                arg2$392
            ]));
        });
        describe('Odd Spacing:', function () {
            it('Highlight', function () {
                const command$419 = handler$398.parse(Message$383(messages$396.detect.highlight_oddspacing));
                assert$375(command$419.command === commandname$387);
                assert$375(equal$376(command$419.args, []));
            });
            it('Args', function () {
                const command$420 = handler$398.parse(Message$383(messages$396.args_oddspacing));
                assert$375(command$420.command === commandname$387);
                assert$375(equal$376(command$420.args, [
                    arg1$391,
                    arg2$392
                ]));
            });
        });
        describe('events are emitted', function () {
            it('of the command name', function (done$422) {
                handler$398.on(commandname$387, function (command$423) {
                    assert$375(command$423.command === commandname$387);
                    done$422();
                });
                handler$398.parse(Message$383(messages$396.command));
            });
        });
    });
    describe('Response handling', function () {
        var receiver$424;
        beforeEach(function () {
            receiver$424 = { say: sinon$374.spy() };
        });
        it('no response', function (done$432) {
            const after$433 = handler$398.getAfter;
            handler$398.after(function () {
                logfn$380('After function called.');
                after$433.apply(handler$398, arguments);
                setImmediate(function () {
                    assert$375(!receiver$424.say.called);
                    done$432();
                });
            });
            handler$398.on(commandname$387, function () {
                return undefined;
            });
            handler$398.parse(Message$383(messages$396.command));
        });
        it('string response', function (done$434) {
            receiver$424.say = function (_sender$435, response$436) {
                try {
                    assert$375(sender$389 === _sender$435);
                    assert$375(response$436 === 'response');
                    assert$375(arguments.length === 2);
                    done$434();
                } catch (e$437) {
                    done$434(e$437);
                }
            };
            handler$398.on(commandname$387, function () {
                return 'response';
            });
            handler$398.parse(Message$383(messages$396.command, receiver$424));
        });
        it('[string] response', function (done$438) {
            receiver$424.say = function (_sender$439, response$440) {
                try {
                    assert$375(sender$389 === _sender$439);
                    assert$375(equal$376(response$440, ['response']));
                    assert$375(arguments.length === 2);
                    done$438();
                } catch (e$441) {
                    done$438(e$441);
                }
            };
            handler$398.on(commandname$387, function () {
                return ['response'];
            });
            handler$398.parse(Message$383(messages$396.command, receiver$424));
        });
        it('Promise<string> response', function (done$442) {
            receiver$424.say = function (_sender$443, response$444) {
                try {
                    assert$375(sender$389 === _sender$443);
                    assert$375(response$444 === 'response');
                    assert$375(arguments.length === 2);
                    done$442();
                } catch (e$445) {
                    done$442(e$445);
                }
            };
            handler$398.on(commandname$387, function () {
                return Q$384('response');
            });
            handler$398.parse(Message$383(messages$396.command, receiver$424));
        });
        it('Promise<[string]> response', function (done$446) {
            receiver$424.say = function (_sender$447, response$448) {
                try {
                    assert$375(sender$389 === _sender$447);
                    assert$375(equal$376(response$448, ['response']));
                    assert$375(arguments.length === 2);
                    done$446();
                } catch (e$449) {
                    done$446(e$449);
                }
            };
            handler$398.on(commandname$387, function () {
                return Q$384(['response']);
            });
            handler$398.parse(Message$383(messages$396.command, receiver$424));
        });
        it('Promise<string> after Promise#catch()', function (done$450) {
            const failHandler$451 = function (command) {
                return Q$384.reject(new Error()).catch(function (err) {
                    console.log('Returning sorry!');
                    return 'Sorry!';
                });
            };
            receiver$424.say = function (sender$452, response$453) {
                try {
                    assert$375(response$453 === 'Sorry!');
                    done$450();
                } catch (e$454) {
                    done$450(e$454);
                }
            };
            handler$398.on(commandname$387, failHandler$451);
            handler$398.parse(Message$383(messages$396.command, receiver$424));
        });
    });
});