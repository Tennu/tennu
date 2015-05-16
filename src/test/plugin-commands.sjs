const sinon = require("sinon");
const assert = require("better-assert");
const equal = require("deep-eql");
const inspect = require("util").inspect;
const format = require("util").format;
require("source-map-support").install();

const debug = false;
const logfn = debug ? console.log.bind(console) : function () {};

const CommandsPluginFactory = require("../tennu_plugins/commands");
const Message = require("../lib/message");
const Promise = require("bluebird");

const prefix = "sender!user@localhost";
const commandname = "command";
const channel = "#test";
const sender = "sender";
const nickname = "testbot";
const arg1 = "arg-1";
const arg2 = "arg-2";

const chanmsg = function (message) {
    return format(format(":%s PRIVMSG %s :%s", prefix, channel, message));
};
const privmsg = function (message) {
    return format(format(":%s PRIVMSG %s :%s", prefix, nickname, message));
};

const messages = {
    noncommand:               chanmsg("hello"),
    noncommand_ctcp:          privmsg("\u0001VERSION\u0001"),
    command:                  privmsg(format("%s",            commandname)),
    detect: {
        trigger:              chanmsg(format("!%s",           commandname)),
        highlight:            chanmsg(format("%s: %s",        nickname, commandname)),
        case_insensitive_highlight: chanmsg(format("%s: %s",  nickname.toUpperCase(), commandname)),
        query:                privmsg(format("%s",            commandname)),
        query_with_trigger:   privmsg(format("!%s",           commandname)),
        highlight_oddspacing: chanmsg(format("  %s:   %s   ", nickname, commandname)),
    },
    args:                     privmsg(format("%s %s %s",      commandname, arg1, arg2)),
    args_oddspacing:          privmsg(format("%s  %s   %s  ", commandname, arg1, arg2)),
    ignore:                   privmsg(format("%s",           "ignored")),
    _: ""
};

describe "Commands Plugin" {
    var client, deps, commands, emitter, acceptPrivmsg;

    beforeEach {
        client = {
            // Logger
            debug: logfn, 
            note: logfn,
            error: logfn,

            // Base
            config: function (value) {
                if (value === "command-trigger") {
                    // TODO(Havvy): Change this to `"*"` or something.
                    return "!";
                } else if (value === "command-ignore-list") {
                    return ["ignored"];
                } else {
                    throw new Error(format("Unknown config value (%s) requested by Commands Plugin.", value));
                }
            },

            // Self
            nickname: function () { return nickname; }
        };
        deps = {};

        commands = CommandsPluginFactory.init(client, deps);

        emitter = commands.subscribe.emitter;
        acceptPrivmsg = function (privmsg) {
            assert(typeof privmsg === "string");
            return commands.handlers["privmsg"](Message(privmsg));
        }
    }

    describe "command detection:" {
        it "subscribes to the '!' prefix" {
            assert(commands.subscribe.prefix === "!");
        }

        it "does nothing with privmsgs that aren't commands" {
            client.note = sinon.spy(client.note);
            acceptPrivmsg(messages.noncommand);
            assert(!client.note.called);
        }

        it skip "does not detect a command for ' ' in query" {}

        it "does not consider CTCPs commands" {
            client.note = sinon.spy(client.note);
            acceptPrivmsg(messages.noncommand_ctcp);
            assert(!client.note.called);
        }

        describe "Recognition Types:" {
            it "Trigger" (done) {
                emitter.on(commandname, function (command) {
                    assert(command.command === commandname);
                    assert(equal(command.args, []));
                    done();
                });

                acceptPrivmsg(messages.detect.trigger);
            }

            it "Highlights" (done) {
                emitter.on(commandname, function (command) {
                    assert(command.command === commandname);
                    assert(equal(command.args, []));
                    done();
                });

                acceptPrivmsg(messages.detect.highlight);
            }

            it "Highlights in case insensitive way" (done) {
                emitter.on(commandname, function (command) {
                    assert(command.command === commandname);
                    assert(equal(command.args, []));  
                    done();
                });

                acceptPrivmsg(messages.detect.case_insensitive_highlight);          
            }

            it "Query" (done) {
                emitter.on(commandname, function (command) {
                    assert(command.command === commandname);
                    assert(equal(command.args, []));
                    done();
                });

                acceptPrivmsg(messages.detect.query);
            }

            it "Query with trigger" (done) {
                emitter.on(commandname, function (command) {
                    assert(command.command === commandname);
                    assert(equal(command.args, []));
                    done();
                });

                acceptPrivmsg(messages.detect.query_with_trigger);
            }
        }

        it "'args' property an array of the words of the message" (done) {
            emitter.on(commandname, function (command) {
                assert(command.command === commandname);
                assert(equal(command.args, [arg1, arg2]));
                done();
            });

            acceptPrivmsg(messages.args);
        }

        describe "Odd Spacing:" {
            it "Highlight" (done) {
                emitter.on(commandname, function (command) {
                    assert(command.command === commandname);
                    assert(equal(command.args, []));
                    done();
                });

                acceptPrivmsg(messages.detect.highlight_oddspacing);
            }

            it "Args" (done) {
                emitter.on(commandname, function (command) {
                    assert(command.command === commandname);
                    assert(equal(command.args, [arg1, arg2]));
                    done();
                });

                acceptPrivmsg(messages.args_oddspacing);
            }
        }
    }

    describe "events are emitted" {
        it "of the command name" (done) {
            emitter.on(commandname, function (command) {
                assert(command.command === commandname);
                done();
            });

            acceptPrivmsg(messages.command);
        }
    }

    it "disallows multiple handlers to the same command" {
        emitter.on(commandname, function () {});

        try {
            emitter.on(commandname, function () {});
            assert(false);
        } catch (e) {
            // catch block required by lexical grammar.
        }
    }

    it "command handler return values are returned to the messages emitter" {
        const returnSetinel = {};

        emitter.on(commandname, function () {
            return returnSetinel;
        });

        assert(acceptPrivmsg(messages.detect.trigger) === returnSetinel);
    }

    it "ignores commands on the ignore-list" {
        emitter.on("ignored", function () {
            throw new Error("Ignored command still handled.");
        });

        acceptPrivmsg(messages.ignore);
    }

    it skip "privmsg of identified command with no handler" {}

    describe "Triggers" {
        it skip "can be the empty string" {}
        it skip "does not trigger for message: ' ' when trigger is empty string" {}
        it skip "can be multiple characters long" {}
    }

    describe "isCommand" {
        it "returns true for commands" {
            assert(commands.exports.isCommand(Message(messages.command)) === true);
        }

        it "returns false for non-commands" {
            assert(commands.exports.isCommand(Message(messages.noncommand)) === false);
        }
    }
}