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
        trigger:              chanmsg(format("*%s",           commandname)),
        highlight:            chanmsg(format("%s: %s",        nickname, commandname)),
        case_insensitive_highlight: chanmsg(format("%s: %s",  nickname.toUpperCase(), commandname)),
        query:                privmsg(format("%s",            commandname)),
        query_with_trigger:   privmsg(format("*%s",           commandname)),
        highlight_oddspacing: chanmsg(format("  %s:   %s   ", nickname, commandname)),
    },
    args:                     privmsg(format("%s %s %s",      commandname, arg1, arg2)),
    args_oddspacing:          privmsg(format("%s  %s   %s  ", commandname, arg1, arg2)),
    spaceQuery:               privmsg(format("%s",            " ")),
    ignore:                   privmsg(format("%s",            "ignored")),
    ignore_in_ignoreme:       privmsg(format("%s",            "ignored-in-ignoreme")),
    ignore_in_ignoremes:      privmsg(format("%s",            "ignored-in-ignorme-and-ignoreme2")),

    _: ""
};

describe("Commands Plugin", function () {
    var client, deps, commands, emitter, acceptPrivmsg;

    beforeEach(function () {
        client = {
            // Logger
            debug: logfn, 
            note: logfn,
            error: logfn,

            // Base
            config: function (value) {
                if (value === "command-trigger") {
                    return "*";
                } else if (value === "command-ignore-list") {
                    return [
                        "ignored",
                        ["ignored-in-ignoreme", "ignoreme"],
                        ["ignored-in-ignorme-and-ignoreme2", "ignoreme", "ignoreme2"]
                    ];
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
    });

    describe("command detection:", function () {
        it("subscribes to the '!' prefix", function () {
            assert(commands.subscribe.prefix === "!");
        });

        it("does nothing with privmsgs that aren't commands", function () {
            client.note = sinon.spy(client.note);
            acceptPrivmsg(messages.noncommand);
            assert(!client.note.called);
        });

        it("does not detect a command for ' ' in query", function () {
            client.note = sinon.spy(client.note);
            acceptPrivmsg(messages.spaceQuery);
            assert(!client.note.called);
        });

        it("does not consider CTCPs commands", function () {
            client.note = sinon.spy(client.note);
            acceptPrivmsg(messages.noncommand_ctcp);
            assert(!client.note.called);
        });

        describe("Recognition Types:", function () {
            it("Trigger", function (done) {
                emitter.on(commandname, function (command) {
                    assert(command.command === commandname);
                    assert(equal(command.args, []));
                    done();
                });

                acceptPrivmsg(messages.detect.trigger);
            });

            it("Highlights", function (done) {
                emitter.on(commandname, function (command) {
                    assert(command.command === commandname);
                    assert(equal(command.args, []));
                    done();
                });

                acceptPrivmsg(messages.detect.highlight);
            });

            it("Highlights in case insensitive way", function (done) {
                emitter.on(commandname, function (command) {
                    assert(command.command === commandname);
                    assert(equal(command.args, []));  
                    done();
                });

                acceptPrivmsg(messages.detect.case_insensitive_highlight);          
            });

            it("Query", function (done) {
                emitter.on(commandname, function (command) {
                    assert(command.command === commandname);
                    assert(equal(command.args, []));
                    done();
                });

                acceptPrivmsg(messages.detect.query);
            });

            it("Query with trigger", function (done) {
                emitter.on(commandname, function (command) {
                    assert(command.command === commandname);
                    assert(equal(command.args, []));
                    done();
                });

                acceptPrivmsg(messages.detect.query_with_trigger);
            });
        });

        it("'args' property an array of the words of the message", function (done) {
            emitter.on(commandname, function (command) {
                assert(command.command === commandname);
                assert(equal(command.args, [arg1, arg2]));
                done();
            });

            acceptPrivmsg(messages.args);
        });

        describe("Odd Spacing:", function () {
            it("Highlight", function (done) {
                emitter.on(commandname, function (command) {
                    assert(command.command === commandname);
                    assert(equal(command.args, []));
                    done();
                });

                acceptPrivmsg(messages.detect.highlight_oddspacing);
            });

            it("Args", function (done) {
                emitter.on(commandname, function (command) {
                    assert(command.command === commandname);
                    assert(equal(command.args, [arg1, arg2]));
                    done();
                });

                acceptPrivmsg(messages.args_oddspacing);
            });
        });
    });

    describe("events are emitted", function () {
        it("of the command name", function (done) {
            emitter.on(commandname, function (command) {
                assert(command.command === commandname);
                done();
            });

            acceptPrivmsg(messages.command);
        });
    });

    it("disallows multiple handlers to the same command", function () {
        emitter.on(commandname, function () {});

        var errorThrown = false;
        try {
            emitter.on(commandname, function () {});
        } catch (e) {
            errorThrown = true;
        }

        assert(errorThrown === true);
    });

    it("command handler return values are returned to the messages emitter wrapped in a Promise", function () {
        const returnSetinel = {};

        emitter.on(commandname, function () {
            return returnSetinel;
        });

        return acceptPrivmsg(messages.command).then(function (retval) { assert(retval === returnSetinel); });
    });

    describe("Ignoring commands", function () {
        // In these tests, we use the fact that handlers for one command
        // are handled before the next command's handlers are handled.
        // Thus, if an ignored command is handled first and fires a
        // reject first, the test will fail. Likewise, if a command that
        // shouldn't be ignored is ignored, then the "command" command
        // handler will reject for those, but if it is not ignored properly,
        // the resolve() will fire first making the reject() do donthing,
        // since rejecting a resolved promise does nothing.

        // We also move promise/resolve/reject into an outer scope
        // so that we don't have to repeat them for every test.
        // In 'real' code, you should have everything you care about in
        // the function that gives resolve/reject when possible.
        var resolve, reject, promise;

        beforeEach(function () {
            promise = new Promise(function (resolver, rejecter) {
                resolve = resolver;
                reject = rejecter;
            });
        });

        it("from anywhere given only a string", function () {
            emitter.on("ignored", function () {
                reject();
            });
            emitter.on("command", function () {
                resolve();
            });

            acceptPrivmsg(messages.ignore);
            acceptPrivmsg(messages.command);

            return promise;
        });

        it("but not from non-plugins when ignored from specific plugins", function () {
            emitter.on("ignored-in-ignoreme", function () {
                resolve();
            });
            emitter.on("command", function () {
                reject();
            });

            acceptPrivmsg(messages.ignore_in_ignoreme);
            acceptPrivmsg(messages.command);

            return promise;
        });

        it("from a specific plugin when ignored from a specific plugin", function () {
            emitter.on("ignored-in-ignoreme", function () {
                reject();
            }, {plugin: "ignoreme"});
            emitter.on("command", function () {
                resolve();
            });

            acceptPrivmsg(messages.ignore_in_ignoreme);
            acceptPrivmsg(messages.command);

            return promise;
        });

        it("but not from a different plugin when ignored from specific plugins", function () {
            emitter.on("ignored-in-ignoreme", function () {
                resolve();
            }, {plugin: "other"});
            emitter.on("command", function () {
                reject();
            });

            acceptPrivmsg(messages.ignore_in_ignoreme);
            acceptPrivmsg(messages.command);

            return promise;
        });

        it("from all plugins when ignored from specific plugins", function () {
            emitter.on("ignored-in-ignorme-and-ignoreme2", function () {
                reject();
            }, {plugin: "ignoreme"});
            emitter.on("ignored-in-ignorme-and-ignoreme2", function () {
                reject();
            }, {plugin: "ignoreme2"});
            emitter.on("command", function () {
                resolve();
            });

            acceptPrivmsg(messages.ignore_in_ignoremes);
            acceptPrivmsg(messages.command);

            return promise;
        });

        it("allows another plugin to handle the command when ignored from specific plugins", function () {
            emitter.on("ignored-in-ignoreme", function () {
                reject();
            }, {plugin: "ignoreme"});
            emitter.on("ignored-in-ignoreme", function () {
                resolve();
            }, {plugin: "other"});

            acceptPrivmsg(messages.ignore_in_ignoreme);

            return promise;
        });
    });

    it.skip("privmsg of identified command with no handler", function () {});

    describe("Triggers", function () {
        it.skip("can be the empty string", function () {});
        it.skip("does not trigger for message: ' ' when trigger is empty string", function () {});
        it.skip("can be multiple characters long", function () {});
    });

    describe("isCommand", function () {
        it("returns true for commands", function () {
            assert(commands.exports.isCommand(Message(messages.command)) === true);
        });

        it("returns false for non-commands", function () {
            assert(commands.exports.isCommand(Message(messages.noncommand)) === false);
        });
    });

    describe("isHandledCommand", function () {
        it("returns true for commands that are handled", function () {
            emitter.on(commandname, function () {});

            assert(commands.exports.isHandledCommand(Message(messages.detect.trigger)) === true);
        });

        it("returns false for commands that are not handled", function () {
            assert(commands.exports.isHandledCommand(Message(messages.detect.trigger)) === false);
        });

        it("returns false for non-commands", function () {
            assert(commands.exports.isHandledCommand(Message(messages.noncommand)) === false);
        });
    });

    describe("Middleware", function () {
        it("calls each ware function (even with or without a handler)", function (done) {
            commands.hooks.commandMiddleware("test", function (command) {
                assert(command.command === commandname);
                done();
            });

            acceptPrivmsg(messages.command);
        });

        it("can return a Promise", function (done) {
            commands.hooks.commandMiddleware("test", function (command) {
                return Promise.resolve(command);
            });

            emitter.on(commandname, function (command) {
                assert(command.command === commandname);
                done();
            });

            acceptPrivmsg(messages.command);
        });

        it("can rename the command", function (done) {
            commands.hooks.commandMiddleware("test", function (command) {
                command.command = "renamed";
                return command;
            });

            emitter.on(commandname, function (command) {
                done("Command was not renamed!");
            });

            emitter.on("renamed", function (command) {
                done();
            });

            acceptPrivmsg(messages.command);
        });

        it("can choose to end the command handling by returning a Response", function () {
            commands.hooks.commandMiddleware("test", function (command) {
                return "Intercepted";
            });

            return acceptPrivmsg(messages.command).then(function (response) { assert(response === "Intercepted"); });
        });

        it.skip("throws an error on adding non-functional middleware", function () {});
    });
});