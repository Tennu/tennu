const sinon$427 = require('sinon');
const assert$428 = require('better-assert');
const equal$429 = require('deep-eql');
const inspect$430 = require('util').inspect;
const format$431 = require('util').format;
const debug$432 = false;
const logfn$433 = debug$432 ? console.log.bind(console) : function () {
    };
const logger$434 = {
        debug: logfn$433,
        info: logfn$433,
        notice: logfn$433,
        warn: logfn$433,
        error: logfn$433
    };
const CommandHandler$435 = require('../lib/command-handler.js');
const Message$436 = require('../lib/message.js');
const Q$437 = require('q');
const config$438 = { trigger: '!' };
const prefix$439 = 'sender!user@localhost';
const commandname$440 = 'command';
const channel$441 = '#test';
const sender$442 = 'sender';
const nickname$443 = 'testbot';
const arg1$444 = 'arg-1';
const arg2$445 = 'arg-2';
const nicknamefn$446 = function () {
    return nickname$443;
};
const chanmsg$447 = function (message) {
    return format$431(format$431(':%s PRIVMSG %s :%s', prefix$439, channel$441, message));
};
const privmsg$448 = function (message) {
    return format$431(format$431(':%s PRIVMSG %s :%s', prefix$439, nickname$443, message));
};
const messages$449 = {
        noncommand: chanmsg$447('hello'),
        command: privmsg$448(format$431('%s', commandname$440)),
        detect: {
            trigger: chanmsg$447(format$431('!%s', commandname$440)),
            highlight: chanmsg$447(format$431('%s: %s', nickname$443, commandname$440)),
            query: privmsg$448(format$431('%s', commandname$440)),
            query_with_trigger: privmsg$448(format$431('!%s', commandname$440)),
            highlight_oddspacing: chanmsg$447(format$431('  %s:   %s   ', nickname$443, commandname$440))
        },
        args: privmsg$448(format$431('%s %s %s', commandname$440, arg1$444, arg2$445)),
        args_oddspacing: privmsg$448(format$431('%s  %s   %s  ', commandname$440, arg1$444, arg2$445))
    };
describe('Command Handler', function () {
    var handler$451;
    beforeEach(function () {
        handler$451 = CommandHandler$435(config$438, nicknamefn$446, logger$434);
    });
    describe('command detection:', function () {
        it('ignores non-commands by returning undefined', function () {
            const message$460 = Message$436(messages$449.noncommand);
            assert$428(handler$451.parse(message$460) === undefined);
        });
        describe('Recognition Types:', function () {
            it('Trigger', function () {
                const command$465 = handler$451.parse(Message$436(messages$449.detect.trigger));
                assert$428(command$465.command === commandname$440);
                assert$428(equal$429(command$465.args, []));
            });
            it('Highlights', function () {
                const command$466 = handler$451.parse(Message$436(messages$449.detect.highlight));
                assert$428(command$466.command === commandname$440);
                assert$428(equal$429(command$466.args, []));
            });
            it('Query', function () {
                const command$467 = handler$451.parse(Message$436(messages$449.detect.query));
                assert$428(command$467.command === commandname$440);
                assert$428(equal$429(command$467.args, []));
            });
            it('Query with trigger', function () {
                const command$468 = handler$451.parse(Message$436(messages$449.detect.query_with_trigger));
                assert$428(command$468.command === commandname$440);
                assert$428(equal$429(command$468.args, []));
            });
        });
        it('"args" property an array of the words of the message', function () {
            const command$469 = handler$451.parse(Message$436(messages$449.args));
            assert$428(command$469.command === commandname$440);
            assert$428(equal$429(command$469.args, [
                arg1$444,
                arg2$445
            ]));
        });
        describe('Odd Spacing:', function () {
            it('Highlight', function () {
                const command$472 = handler$451.parse(Message$436(messages$449.detect.highlight_oddspacing));
                assert$428(command$472.command === commandname$440);
                assert$428(equal$429(command$472.args, []));
            });
            it('Args', function () {
                const command$473 = handler$451.parse(Message$436(messages$449.args_oddspacing));
                assert$428(command$473.command === commandname$440);
                assert$428(equal$429(command$473.args, [
                    arg1$444,
                    arg2$445
                ]));
            });
        });
        describe('events are emitted', function () {
            it('of the command name', function (done$475) {
                handler$451.on(commandname$440, function (command$476) {
                    assert$428(command$476.command === commandname$440);
                    done$475();
                });
                handler$451.parse(Message$436(messages$449.command));
            });
        });
    });
    describe('Response handling', function () {
        var receiver$477;
        beforeEach(function () {
            receiver$477 = { say: sinon$427.spy() };
        });
        it('no response', function (done$485) {
            const after$486 = handler$451.getAfter;
            handler$451.after(function () {
                logfn$433('After function called.');
                after$486.apply(handler$451, arguments);
                setImmediate(function () {
                    assert$428(!receiver$477.say.called);
                    done$485();
                });
            });
            handler$451.on(commandname$440, function () {
                return undefined;
            });
            handler$451.parse(Message$436(messages$449.command));
        });
        it('string response', function (done$487) {
            receiver$477.say = function (_sender$488, response$489) {
                try {
                    assert$428(sender$442 === _sender$488);
                    assert$428(response$489 === 'response');
                    assert$428(arguments.length === 2);
                    done$487();
                } catch (e$490) {
                    done$487(e$490);
                }
            };
            handler$451.on(commandname$440, function () {
                return 'response';
            });
            handler$451.parse(Message$436(messages$449.command, receiver$477));
        });
        it('[string] response', function (done$491) {
            receiver$477.say = function (_sender$492, response$493) {
                try {
                    assert$428(sender$442 === _sender$492);
                    assert$428(equal$429(response$493, ['response']));
                    assert$428(arguments.length === 2);
                    done$491();
                } catch (e$494) {
                    done$491(e$494);
                }
            };
            handler$451.on(commandname$440, function () {
                return ['response'];
            });
            handler$451.parse(Message$436(messages$449.command, receiver$477));
        });
        it('Promise<string> response', function (done$495) {
            receiver$477.say = function (_sender$496, response$497) {
                try {
                    assert$428(sender$442 === _sender$496);
                    assert$428(response$497 === 'response');
                    assert$428(arguments.length === 2);
                    done$495();
                } catch (e$498) {
                    done$495(e$498);
                }
            };
            handler$451.on(commandname$440, function () {
                return Q$437('response');
            });
            handler$451.parse(Message$436(messages$449.command, receiver$477));
        });
        it('Promise<[string]> response', function (done$499) {
            receiver$477.say = function (_sender$500, response$501) {
                try {
                    assert$428(sender$442 === _sender$500);
                    assert$428(equal$429(response$501, ['response']));
                    assert$428(arguments.length === 2);
                    done$499();
                } catch (e$502) {
                    done$499(e$502);
                }
            };
            handler$451.on(commandname$440, function () {
                return Q$437(['response']);
            });
            handler$451.parse(Message$436(messages$449.command, receiver$477));
        });
        it('Promise<string> after Promise#catch()', function (done$503) {
            const failHandler$504 = function (command) {
                return Q$437.reject(new Error()).catch(function (err) {
                    console.log('Returning sorry!');
                    return 'Sorry!';
                });
            };
            receiver$477.say = function (sender$505, response$506) {
                try {
                    assert$428(response$506 === 'Sorry!');
                    done$503();
                } catch (e$507) {
                    done$503(e$507);
                }
            };
            handler$451.on(commandname$440, failHandler$504);
            handler$451.parse(Message$436(messages$449.command, receiver$477));
        });
    });
});