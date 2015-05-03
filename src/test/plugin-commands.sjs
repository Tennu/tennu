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

const config = {
    "command-trigger": "!"
};

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
};

describe "Commands Plugin" {
    var client, deps, commands, emitter, acceptPrivmsg;

    beforeEach {
        client = {
            // Logger
            note: sinon.spy(logfn),
            error: logfn,

            // Base
            config: function (value) {
                if (value === "command-trigger") {
                    return "!";
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
            commands.handlers["privmsg"](Message(privmsg));
        }
    }

    describe "command detection:" {
        it "subscribes to the '!' prefix" {
            assert(commands.subscribe.prefix === "!");
        }

        it "does nothing with privmsgs that aren't commands" {
            acceptPrivmsg(messages.noncommand);
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

        describe "events are emitted" {
            it "of the command name" (done) {
                emitter.on(commandname, function (command) {
                    assert(command.command === commandname);
                    done();
                });

                acceptPrivmsg(messages.command);
            }
        }
    }
}