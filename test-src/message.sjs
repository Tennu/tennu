var sinon = require('sinon');
var assert = require('better-assert');
var equal = require('deep-eql');
var inspect = require('util').inspect;
var format = require('util').format;

var Message = require('../lib/message');
var receiver = {toString: function () { return '[Object Receiver]'}, nickname: function () { return 'bot'}};

var hostmask = 'sender!malicious@test.suite.net';
var nickname = 'buddy';
var server = 'server.network.net';
var channel = '#channel';
var arg1 = 'arg-1';
var arg2 = 'arg-2';
var restargs = 'rest arguments';
var reason = 'Because I want to.';

var messages = {
    generic:                    format('GENERIC'),
    generic_args:               format('GENERIC %s %s :%s', arg1, arg2, restargs),
    generic_prefix_server_args: format(':%s GENERIC %s %s :%s', server, arg1, arg2, restargs),
    generic_prefix_hostmask:    format(':%s GENERIC', hostmask),
    generic_oddspacing:         format('GENERIC    %s     %s    :%s', arg1, arg2, 'rest arguments    '),

    privmsg_channel:            format(':%s PRIVMSG %s :%s', hostmask, channel, 'somebody said something'),
    privmsg_query:              format(':%s PRIVMSG %s :%s', hostmask, receiver.nickname(), 'hi hi'),
    privmsg_oddspacing:         ':sender!user@localhost PRIVMSG #test :    testbot:     testcommand     ',

    join:                       format(':%s JOIN %s', hostmask, channel),

    part:                       format(':%s PART %s', hostmask, channel),
    part_reason:                format(':%s PART %s :%s', hostmask, channel, reason),

    quit:                       format(':%s QUIT %s', hostmask, channel),
    quit_reason:                format(':%s QUIT %s :%s', hostmask, channel, reason)
};

describe 'Message' {
    describe 'common properties' {
        it 'for no-args, no-prefix, no-tags' {
            var message = Message(messages.generic, receiver);

            assert(message.receiver === receiver);
            assert(message.command === 'generic');
            assert(equal(message.params, []));
            assert(message.prefix === '');
            assert(equal(message.tags, {}));
            assert(message.hostmask === null);
        }

        it 'for args, no-prefix, no-tags' {
            var message = Message(messages.generic_args, receiver);

            assert(message.receiver === receiver);
            assert(message.command === 'generic')
            assert(equal(message.params, [arg1, arg2, restargs]));
            assert(message.prefix === '');
            assert(equal(message.tags, {}));
            assert(message.hostmask === null);
        }

        it 'for args, server prefix, no-tags' {
            var message = Message(messages.generic_prefix_server_args, receiver);

            assert(message.receiver === receiver);
            assert(message.command === 'generic');
            assert(equal(message.params, [arg1, arg2, restargs]));
            assert(message.prefix === server);
            assert(equal(message.tags, {}));
            assert(message.hostmask === null);
        }

        it 'for no-args, hostmask prefix, no-tags' {
            var message = Message(messages.generic_prefix_hostmask, receiver);

            assert(message.receiver === receiver);
            assert(message.command === 'generic');
            assert(equal(message.params, []));
            assert(message.prefix === hostmask);
            assert(equal(message.tags, {}));
            assert(equal(message.hostmask, {nickname: 'sender', username: 'malicious', hostname: 'test.suite.net'}));
            assert(message.nickname === message.hostmask.nickname);
        }

        it 'handles odd spacing' {
            var message = Message(messages.generic_oddspacing, receiver);

            assert(message.receiver === receiver);
            assert(message.command === 'generic');
            assert(equal(message.params, [arg1, arg2, 'rest arguments    ']));
            assert(message.prefix === '');
            assert(equal(message.tags, {}));
            assert(message.hostmask === null);
        }
    }

    describe 'of type:' {
        describe 'privmsg:' {
            it 'channel' {
                var message = Message(messages.privmsg_channel, receiver);

                assert(message.command === 'privmsg');
                assert(!message.isQuery);
                assert(message.nicknamename === message.hostmask.nicknamename)
                assert(message.channel === '#channel');
                assert(message.message === 'somebody said something');
            }

            it 'query' {
                var message = Message(messages.privmsg_query, receiver);

                assert(message.command === 'privmsg');
                assert(message.channel === 'sender');

                assert(message.isQuery)
                assert(message.message === 'hi hi');
            }

            it 'odd spacing' {
                var message = Message(messages.privmsg_oddspacing, receiver);

                assert(message.params[0] === '#test');
                assert(message.params[1] === '    testbot:     testcommand     ');

                assert(message.command === 'privmsg');
                assert(message.channel === '#test');

                assert(!message.isQuery);
                assert(message.message === 'testbot:     testcommand');
            }
        }

        it 'join' {
            var message = Message(messages.join, receiver);

            assert(message.channel === channel);
        }

        describe 'part:' {
            it 'with reason' {
                var message = Message(messages.part_reason, receiver);

                assert(message.channel === channel);
                assert(message.reason === reason);
            }

            it 'without reason' {
                var message = Message(messages.part, receiver);

                assert(message.channel === channel);
                assert(message.reason === undefined);
                assert(message.hasOwnProperty('reason'));
            }
        }

        describe 'quit:' {
            it 'with reason' {
                var message = Message(messages.quit_reason, receiver);

                assert(message.channel === channel);
                assert(message.reason === reason);       
            }

            it 'without reason' {
                var message = Message(messages.quit, receiver);

                assert(message.channel === channel);
                assert(message.reason === undefined);
                assert(message.hasOwnProperty('reason'));   
            }
        }
    }
}