const sinon = require("sinon");
const assert = require("better-assert");
const equal = require("deep-eql");
const inspect = require("util").inspect;
const format = require("util").format;
require("source-map-support").install();

const debug = false;
const logfn = debug ? console.log.bind(console) : function () {};

const MessagePluginFactory = require("../tennu_plugins/messages");
const Message = require("../lib/message");
const EventEmitter = require("events").EventEmitter;

const prefix = "irc.mibbit.net";
const command = "generic";
const arg1 = "arg1";
const arg2 = "arg2";
const argr = "rest args";
const raw = format(":%s %s %s %s :%s", prefix, command, arg1, arg2, argr);

describe "Messages Plugin" {
    var client, messages, emitter, acceptData, defaultPrefix, deps;

    beforeEach {
        defaultPrefix = {}
        client = {
            debug: logfn,
            error: logfn,
            _socket: new EventEmitter()
        };
        deps = { subscriber: {defaultPrefix: defaultPrefix} };

        messages = MessagePluginFactory.init(client, deps);

        emitter = messages.subscribe.emitter;
        acceptData = function (data) {
            client._socket.emit("data", data);
        };
    }

    it "subscribes to the default prefix" {
        assert(messages.subscribe.prefix === defaultPrefix);
    }

    it "parses socket data events into Message and emits the Message.command name" {
        emitter.on("generic", function (message) {
            assert(evtval.prefix === prefix);
            assert(evtval.command === command);
            assert(evtval.params[0] === arg1);
            assert(evtval.params[1] === arg2);
            assert(evtval.params[2] === argr);
            done();
        });

        acceptData(raw);
    }

    describe skip "`*` event" {
        it "is called with every function" (done) {
            var count = 0;

            parser.on("*", function (message) {
                count += 1;

                if (count === 2) {
                    done();
                }
            });

            parser.parse(raw);
            parser.parse(raw);
        }
    }

    // TODO(Havvy): Make these work with Messages, not commands.
    //              Need to create raw messages to work with too.
    describe skip "Response handling" {
        it "no response" (done) {
            emitter.after(function () {
                try {
                    logfn("After function called.");
                    assert(!client.say.called);
                    done();
                } catch (e) {
                    done(e);
                }
            });

            emitter.on(commandname, function () {
                return undefined;
            });

            acceptData(messages.command);
        }

        it "string response" (done) {
            client.say = function (_sender, response) {
                try {
                    assert(sender === _sender);
                    assert(response === "response");
                    assert(arguments.length === 2);
                    done();   
                } catch (e) {
                    done(e);
                }
            };

            emitter.on(commandname, function () {
                return "response";
            });

            acceptData(messages.command);
        }

        it "[string] response" (done) {
            client.say = function (_sender, response) {
                try {
                    assert(sender === _sender);
                    assert(equal(response, ["response"]));
                    assert(arguments.length === 2);
                    done();   
                } catch (e) {
                    done(e);
                }
            };

            emitter.on(commandname, function () {
                return ["response"];
            });

            acceptData(messages.command);
        }

        it "Promise<string> response" (done) {
            client.say = function (_sender, response) {
                try {
                    assert(sender === _sender);
                    assert(response === "response");
                    assert(arguments.length === 2);
                    done();   
                } catch (e) {
                    done(e);
                }
            };

            emitter.on(commandname, function () {
                return Promise.resolve("response");
            });

            acceptData(messages.command);
        }

        it "Promise<[string]> response" (done) {
            client.say = function (_sender, response) {
                try {
                    assert(sender === _sender);
                    assert(equal(response, ["response"]));
                    assert(arguments.length === 2);
                    done();   
                } catch (e) {
                    done(e);
                }
            };

            emitter.on(commandname, function () {
                return Promise.resolve(["response"]);
            });

            acceptData(messages.command);
        }

        it "Promise<string> after Promise#catch()" (done) {
            const failHandler = function (command) {
                return Promise
                .reject(new Error())
                .catch(function (err) {
                    console.log("Returning sorry!");
                    return "Sorry!";
                });
            };

            client.say = function (sender, response) {
                try {
                    assert(response === "Sorry!");
                    done();   
                } catch (e) {
                    done(e);
                }
            };

            emitter.on(commandname, failHandler);

            acceptData(messages.command);
        }
    }
}
