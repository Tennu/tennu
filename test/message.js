var sinon$608 = require('sinon');
var assert$609 = require('better-assert');
var equal$610 = require('deep-eql');
var inspect$611 = require('util').inspect;
var format$612 = require('util').format;
var Message$613 = require('../lib/message');
var receiver$614 = {
        toString: function () {
            return '[Object Receiver]';
        },
        nickname: function () {
            return 'bot';
        }
    };
var hostmask$615 = 'sender!malicious@test.suite.net';
var nickname$616 = 'buddy';
var server$617 = 'server.network.net';
var channel$618 = '#channel';
var arg1$619 = 'arg-1';
var arg2$620 = 'arg-2';
var restargs$621 = 'rest arguments';
var reason$622 = 'Because I want to.';
var messages$623 = {
        generic: format$612('GENERIC'),
        generic_args: format$612('GENERIC %s %s :%s', arg1$619, arg2$620, restargs$621),
        generic_prefix_server_args: format$612(':%s GENERIC %s %s :%s', server$617, arg1$619, arg2$620, restargs$621),
        generic_prefix_hostmask: format$612(':%s GENERIC', hostmask$615),
        generic_oddspacing: format$612('GENERIC    %s     %s    :%s', arg1$619, arg2$620, 'rest arguments    '),
        privmsg_channel: format$612(':%s PRIVMSG %s :%s', hostmask$615, channel$618, 'somebody said something'),
        privmsg_query: format$612(':%s PRIVMSG %s :%s', hostmask$615, receiver$614.nickname(), 'hi hi'),
        privmsg_oddspacing: ':sender!user@localhost PRIVMSG #test :    testbot:     testcommand     ',
        join: format$612(':%s JOIN %s', hostmask$615, channel$618),
        part: format$612(':%s PART %s', hostmask$615, channel$618),
        part_reason: format$612(':%s PART %s :%s', hostmask$615, channel$618, reason$622)
    };
describe('Message', function () {
    describe('common properties', function () {
        it('for no-args, no-prefix, no-tags', function () {
            var message$632 = Message$613(messages$623.generic, receiver$614);
            assert$609(message$632.receiver === receiver$614);
            assert$609(message$632.command === 'generic');
            assert$609(equal$610(message$632.params, []));
            assert$609(message$632.prefix === '');
            assert$609(equal$610(message$632.tags, {}));
            assert$609(message$632.hostmask === null);
        });
        it('for args, no-prefix, no-tags', function () {
            var message$633 = Message$613(messages$623.generic_args, receiver$614);
            assert$609(message$633.receiver === receiver$614);
            assert$609(message$633.command === 'generic');
            assert$609(equal$610(message$633.params, [
                arg1$619,
                arg2$620,
                restargs$621
            ]));
            assert$609(message$633.prefix === '');
            assert$609(equal$610(message$633.tags, {}));
            assert$609(message$633.hostmask === null);
        });
        it('for args, server prefix, no-tags', function () {
            var message$634 = Message$613(messages$623.generic_prefix_server_args, receiver$614);
            assert$609(message$634.receiver === receiver$614);
            assert$609(message$634.command === 'generic');
            assert$609(equal$610(message$634.params, [
                arg1$619,
                arg2$620,
                restargs$621
            ]));
            assert$609(message$634.prefix === server$617);
            assert$609(equal$610(message$634.tags, {}));
            assert$609(message$634.hostmask === null);
        });
        it('for no-args, hostmask prefix, no-tags', function () {
            var message$635 = Message$613(messages$623.generic_prefix_hostmask, receiver$614);
            assert$609(message$635.receiver === receiver$614);
            assert$609(message$635.command === 'generic');
            assert$609(equal$610(message$635.params, []));
            assert$609(message$635.prefix === hostmask$615);
            assert$609(equal$610(message$635.tags, {}));
            assert$609(equal$610(message$635.hostmask, {
                nickname: 'sender',
                username: 'malicious',
                hostname: 'test.suite.net'
            }));
            assert$609(message$635.nickname === message$635.hostmask.nickname);
        });
        it('handles odd spacing', function () {
            var message$636 = Message$613(messages$623.generic_oddspacing, receiver$614);
            assert$609(message$636.receiver === receiver$614);
            assert$609(message$636.command === 'generic');
            assert$609(equal$610(message$636.params, [
                arg1$619,
                arg2$620,
                'rest arguments    '
            ]));
            assert$609(message$636.prefix === '');
            assert$609(equal$610(message$636.tags, {}));
            assert$609(message$636.hostmask === null);
        });
    });
    describe('of type:', function () {
        describe('privmsg:', function () {
            it('channel', function () {
                var message$643 = Message$613(messages$623.privmsg_channel, receiver$614);
                assert$609(message$643.command === 'privmsg');
                assert$609(!message$643.isQuery);
                assert$609(message$643.nicknamename === message$643.hostmask.nicknamename);
                assert$609(message$643.channel === '#channel');
                assert$609(message$643.message === 'somebody said something');
            });
            it('query', function () {
                var message$644 = Message$613(messages$623.privmsg_query, receiver$614);
                assert$609(message$644.command === 'privmsg');
                assert$609(message$644.channel === 'sender');
                assert$609(message$644.isQuery);
                assert$609(message$644.message === 'hi hi');
            });
            it('odd spacing', function () {
                var message$645 = Message$613(messages$623.privmsg_oddspacing, receiver$614);
                assert$609(message$645.params[0] === '#test');
                assert$609(message$645.params[1] === '    testbot:     testcommand     ');
                assert$609(message$645.command === 'privmsg');
                assert$609(message$645.channel === '#test');
                assert$609(!message$645.isQuery);
                assert$609(message$645.message === 'testbot:     testcommand');
            });
        });
        it('join', function () {
            var message$646 = Message$613(messages$623.join, receiver$614);
            assert$609(message$646.channel === channel$618);
        });
        describe('part:', function () {
            it('with reason', function () {
                var message$649 = Message$613(messages$623.part_reason, receiver$614);
                assert$609(message$649.channel === channel$618);
                assert$609(message$649.reason === reason$622);
            });
            it('without reason', function () {
                var message$650 = Message$613(messages$623.part, receiver$614);
                assert$609(message$650.channel === channel$618);
                assert$609(message$650.reason === undefined);
                assert$609(message$650.hasOwnProperty('reason'));
            });
        });
    });
});