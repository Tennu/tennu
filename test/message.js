var sinon$634 = require('sinon');
var assert$635 = require('better-assert');
var equal$636 = require('deep-eql');
var inspect$637 = require('util').inspect;
var format$638 = require('util').format;
var Message$639 = require('../lib/message');
var receiver$640 = {
        toString: function () {
            return '[Object Receiver]';
        },
        nickname: function () {
            return 'bot';
        }
    };
var hostmask$641 = 'sender!malicious@test.suite.net';
var nickname$642 = 'buddy';
var server$643 = 'server.network.net';
var channel$644 = '#channel';
var arg1$645 = 'arg-1';
var arg2$646 = 'arg-2';
var restargs$647 = 'rest arguments';
var reason$648 = 'Because I want to.';
var messages$649 = {
        generic: format$638('GENERIC'),
        generic_args: format$638('GENERIC %s %s :%s', arg1$645, arg2$646, restargs$647),
        generic_prefix_server_args: format$638(':%s GENERIC %s %s :%s', server$643, arg1$645, arg2$646, restargs$647),
        generic_prefix_hostmask: format$638(':%s GENERIC', hostmask$641),
        generic_oddspacing: format$638('GENERIC    %s     %s    :%s', arg1$645, arg2$646, 'rest arguments    '),
        privmsg_channel: format$638(':%s PRIVMSG %s :%s', hostmask$641, channel$644, 'somebody said something'),
        privmsg_query: format$638(':%s PRIVMSG %s :%s', hostmask$641, receiver$640.nickname(), 'hi hi'),
        privmsg_oddspacing: ':sender!user@localhost PRIVMSG #test :    testbot:     testcommand     ',
        join: format$638(':%s JOIN %s', hostmask$641, channel$644),
        part: format$638(':%s PART %s', hostmask$641, channel$644),
        part_reason: format$638(':%s PART %s :%s', hostmask$641, channel$644, reason$648)
    };
describe('Message', function () {
    describe('common properties', function () {
        it('for no-args, no-prefix, no-tags', function () {
            var message$658 = Message$639(messages$649.generic, receiver$640);
            assert$635(message$658.receiver === receiver$640);
            assert$635(message$658.command === 'generic');
            assert$635(equal$636(message$658.params, []));
            assert$635(message$658.prefix === '');
            assert$635(equal$636(message$658.tags, {}));
            assert$635(message$658.hostmask === null);
        });
        it('for args, no-prefix, no-tags', function () {
            var message$659 = Message$639(messages$649.generic_args, receiver$640);
            assert$635(message$659.receiver === receiver$640);
            assert$635(message$659.command === 'generic');
            assert$635(equal$636(message$659.params, [
                arg1$645,
                arg2$646,
                restargs$647
            ]));
            assert$635(message$659.prefix === '');
            assert$635(equal$636(message$659.tags, {}));
            assert$635(message$659.hostmask === null);
        });
        it('for args, server prefix, no-tags', function () {
            var message$660 = Message$639(messages$649.generic_prefix_server_args, receiver$640);
            assert$635(message$660.receiver === receiver$640);
            assert$635(message$660.command === 'generic');
            assert$635(equal$636(message$660.params, [
                arg1$645,
                arg2$646,
                restargs$647
            ]));
            assert$635(message$660.prefix === server$643);
            assert$635(equal$636(message$660.tags, {}));
            assert$635(message$660.hostmask === null);
        });
        it('for no-args, hostmask prefix, no-tags', function () {
            var message$661 = Message$639(messages$649.generic_prefix_hostmask, receiver$640);
            assert$635(message$661.receiver === receiver$640);
            assert$635(message$661.command === 'generic');
            assert$635(equal$636(message$661.params, []));
            assert$635(message$661.prefix === hostmask$641);
            assert$635(equal$636(message$661.tags, {}));
            assert$635(equal$636(message$661.hostmask, {
                nickname: 'sender',
                username: 'malicious',
                hostname: 'test.suite.net'
            }));
            assert$635(message$661.nickname === message$661.hostmask.nickname);
        });
        it('handles odd spacing', function () {
            var message$662 = Message$639(messages$649.generic_oddspacing, receiver$640);
            assert$635(message$662.receiver === receiver$640);
            assert$635(message$662.command === 'generic');
            assert$635(equal$636(message$662.params, [
                arg1$645,
                arg2$646,
                'rest arguments    '
            ]));
            assert$635(message$662.prefix === '');
            assert$635(equal$636(message$662.tags, {}));
            assert$635(message$662.hostmask === null);
        });
    });
    describe('of type:', function () {
        describe('privmsg:', function () {
            it('channel', function () {
                var message$669 = Message$639(messages$649.privmsg_channel, receiver$640);
                assert$635(message$669.command === 'privmsg');
                assert$635(!message$669.isQuery);
                assert$635(message$669.nicknamename === message$669.hostmask.nicknamename);
                assert$635(message$669.channel === '#channel');
                assert$635(message$669.message === 'somebody said something');
            });
            it('query', function () {
                var message$670 = Message$639(messages$649.privmsg_query, receiver$640);
                assert$635(message$670.command === 'privmsg');
                assert$635(message$670.channel === 'sender');
                assert$635(message$670.isQuery);
                assert$635(message$670.message === 'hi hi');
            });
            it('odd spacing', function () {
                var message$671 = Message$639(messages$649.privmsg_oddspacing, receiver$640);
                assert$635(message$671.params[0] === '#test');
                assert$635(message$671.params[1] === '    testbot:     testcommand     ');
                assert$635(message$671.command === 'privmsg');
                assert$635(message$671.channel === '#test');
                assert$635(!message$671.isQuery);
                assert$635(message$671.message === 'testbot:     testcommand');
            });
        });
        it('join', function () {
            var message$672 = Message$639(messages$649.join, receiver$640);
            assert$635(message$672.channel === channel$644);
        });
        describe('part:', function () {
            it('with reason', function () {
                var message$675 = Message$639(messages$649.part_reason, receiver$640);
                assert$635(message$675.channel === channel$644);
                assert$635(message$675.reason === reason$648);
            });
            it('without reason', function () {
                var message$676 = Message$639(messages$649.part, receiver$640);
                assert$635(message$676.channel === channel$644);
                assert$635(message$676.reason === undefined);
                assert$635(message$676.hasOwnProperty('reason'));
            });
        });
    });
});