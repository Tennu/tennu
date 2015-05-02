const sinon = require("sinon");
const assert = require("better-assert");
const equal = require("deep-eql");
const inspect = require("util").inspect;
const format = require("util").format;
require("source-map-support").install();

const Message = require("../lib/message");

const hostmask = "sender!malicious@test.suite.net";
const nickname = "buddy";
const server = "server.network.net";
const channel = "#channel";
const arg1 = "arg-1";
const arg2 = "arg-2";
const restargs = "rest arguments";
const reason = "Because I want to.";
const nick1 = "adam";
const nick2 = "beatrice";
const nick3 = "charlie";

const messages = {
    generic:                    format("GENERIC"),
    generic_args:               format("GENERIC %s %s :%s", arg1, arg2, restargs),
    generic_prefix_server_args: format(":%s GENERIC %s %s :%s", server, arg1, arg2, restargs),
    generic_prefix_hostmask:    format(":%s GENERIC", hostmask),
    generic_oddspacing:         format("GENERIC    %s     %s    :%s", arg1, arg2, "rest arguments    "),

    privmsg_channel:            format(":%s PRIVMSG %s :%s", hostmask, channel, "somebody said something"),
    privmsg_query:              format(":%s PRIVMSG %s :%s", hostmask, nickname, "hi hi"),
    privmsg_oddspacing:         ":sender!user@localhost PRIVMSG #test :    testbot:     testcommand     ",

    join:                       format(":%s JOIN %s", hostmask, channel),

    part:                       format(":%s PART %s", hostmask, channel),
    part_reason:                format(":%s PART %s :%s", hostmask, channel, reason),

    quit:                       format(":%s QUIT", hostmask),
    quit_reason:                format(":%s QUIT :%s", hostmask, reason),
    a_353_with_whitespace:      format(":%s 353 %s = %s :%s %s %s ", server, nickname, channel, nick1, nick2, nick3)
};

describe "Message" {
    describe "common properties" {
        it "for no-args, no-prefix, no-tags" {
            const message = Message(messages.generic);

            assert(message.command === "generic");
            assert(equal(message.params, []));
            assert(message.prefix === "");
            assert(equal(message.tags, {}));
            assert(message.hostmask === null);
        }

        it "for args, no-prefix, no-tags" {
            const message = Message(messages.generic_args);

            assert(message.command === "generic")
            assert(equal(message.params, [arg1, arg2, restargs]));
            assert(message.prefix === "");
            assert(equal(message.tags, {}));
            assert(message.hostmask === null);
        }

        it "for args, server prefix, no-tags" {
            const message = Message(messages.generic_prefix_server_args);

            assert(message.command === "generic");
            assert(equal(message.params, [arg1, arg2, restargs]));
            assert(message.prefix === server);
            assert(equal(message.tags, {}));
            assert(message.hostmask === null);
        }

        it "for no-args, hostmask prefix, no-tags" {
            const message = Message(messages.generic_prefix_hostmask);

            assert(message.command === "generic");
            assert(equal(message.params, []));
            assert(message.prefix === hostmask);
            assert(equal(message.tags, {}));
            assert(equal(message.hostmask, {nickname: "sender", username: "malicious", hostname: "test.suite.net"}));
            assert(message.nickname === message.hostmask.nickname);
        }

        it "handles odd spacing" {
            const message = Message(messages.generic_oddspacing);

            assert(message.command === "generic");
            assert(equal(message.params, [arg1, arg2, "rest arguments    "]));
            assert(message.prefix === "");
            assert(equal(message.tags, {}));
            assert(message.hostmask === null);
        }
    }

    describe "of type:" {
        describe "privmsg:" {
            it "channel" {
                const message = Message(messages.privmsg_channel);

                assert(message.command === "privmsg");
                assert(!message.isQuery);
                assert(message.nicknamename === message.hostmask.nicknamename)
                assert(message.channel === "#channel");
                assert(message.message === "somebody said something");
            }

            it "query" {
                const message = Message(messages.privmsg_query);

                assert(message.command === "privmsg");
                assert(message.channel === "sender");

                assert(message.isQuery)
                assert(message.message === "hi hi");
            }

            it "odd spacing" {
                const message = Message(messages.privmsg_oddspacing);

                assert(message.params[0] === "#test");
                assert(message.params[1] === "    testbot:     testcommand     ");

                assert(message.command === "privmsg");
                assert(message.channel === "#test");

                assert(!message.isQuery);
                assert(message.message === "testbot:     testcommand");
            }
        }

        it "join" {
            const message = Message(messages.join);

            assert(message.channel === channel);
        }

        describe "part:" {
            it "with reason" {
                const message = Message(messages.part_reason);

                assert(message.channel === channel);
                assert(message.reason === reason);
            }

            it "without reason" {
                const message = Message(messages.part);

                assert(message.channel === channel);
                assert(message.reason === undefined);
                assert(message.hasOwnProperty("reason"));
            }
        }

        describe "quit:" {
            it "with reason" {
                const message = Message(messages.quit_reason);

                assert(message.reason === reason);       
            }

            it "without reason" {
                const message = Message(messages.quit);

                assert(message.reason === undefined);
                assert(message.hasOwnProperty("reason"));   
            }
        }

        describe "mode:" {
            it skip "Setting a flag" {}
            it skip "Unsetting a flag" {}
            it skip "Setting a parametized value" {}
            it skip "Unsetting a parametized value" {}
            it skip "Setting a nicklist value" {}
            it skip "Unsetting a nicklist value" {}
        }

        describe "353:" {
            it "creates correct nicknames array" {
                var message = Message(messages.a_353_with_whitespace);

                assert(message.nicknames.length === 3);
                assert(message.nicknames[0] === "adam");
                assert(message.nicknames[1] === "beatrice");
                assert(message.nicknames[2] === "charlie");
            }
        }
    }
}