const sinon = require("sinon");
const assert = require("better-assert");
const equal = require("deep-eql");
const inspect = require("util").inspect;
const format = require("util").format;
require("source-map-support").install();
const Promise = require("bluebird");

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

const hostmask = "nick!user@host.net";
const channel = "#channel";

const raws = {
    generic: format(":%s %s %s %s :%s", prefix, command, arg1, arg2, argr),
    generic_upper: format(":%s %s %s %s :%s", prefix, command.toUpperCase(), arg1, arg2, argr),
    join: format(":%s JOIN %s", hostmask, channel),
    welcome: ":irc.test.net 001 tennu :Welcome to the Test Network tennu!tennu@tennu.net",
    _: ""
};

describe("Messages Plugin", function () {
    var defaultPrefix, client, deps, messages, emitter, afterEmit, acceptData;

    beforeEach(function () {
        defaultPrefix = {}
        client = {
            say: logfn,
            debug: logfn,
            error: logfn,
            _socket: new EventEmitter()
        };
        deps = { subscriber: {defaultPrefix: defaultPrefix} };

        messages = MessagePluginFactory.init(client, deps);

        emitter = messages.subscribe.emitter;
        afterEmit = messages.exports.afterEmit;
        acceptData = function (data) {
            client._socket.emit("data", data);
        };
    });

    it("subscribes to the default prefix", function () {
        assert(messages.subscribe.prefix === defaultPrefix);
    });

    describe("Parsing Socket Data Events", function () {
        it("Emits the Message.command name", function () {
            emitter.on("generic", function (message) {
                assert(evtval.prefix === prefix);
                assert(evtval.command === command);
                assert(evtval.params[0] === arg1);
                assert(evtval.params[1] === arg2);
                assert(evtval.params[2] === argr);
                done();
            });

            acceptData(raws.generic);
        });

        it("Emits Message.command in lower case", function () {
            emitter.on("generic", function (message) {
                assert(evtval.prefix === prefix);
                assert(evtval.command === command);
                assert(evtval.params[0] === arg1);
                assert(evtval.params[1] === arg2);
                assert(evtval.params[2] === argr);
                done();
            });

            acceptData(raws.generic_upper);
        });

        it("subscribes command names case insenitively", function () {
            emitter.on("GENERIC", function (message) {
                assert(evtval.prefix === prefix);
                assert(evtval.command === command);
                assert(evtval.params[0] === arg1);
                assert(evtval.params[1] === arg2);
                assert(evtval.params[2] === argr);
                done();
            });

            acceptData(raws.generic);
        });

        it("Emits the Replyname too", function () {
            emitter.on("rpl_welcome", function (message) {
                done();
            });

            acceptData(raws.welcome);
        });

        it("subscribes replyname case insenitively", function () {
            emitter.on("RPL_WELCOME", function (message) {
                done();
            });

            acceptData(raws.welcome);
        });

        it("emits '*'", function (done) {
            var count = 0;

            emitter.on("*", function (message) {
                count += 1;

                if (count === 2) {
                    done();
                }
            });

            acceptData(raws.generic);
            acceptData(raws.generic);
        });
    });

    describe("Response handling", function () {
        it("no response", function (done) {
            client.say = sinon.spy(client.say);

            afterEmit(function () {
                try {
                    assert(!client.say.called);
                    done();
                } catch (e) {
                    done(e);
                }
            });

            emitter.on("join", function () {
                return undefined;
            });

            acceptData(raws.join);
        });

        it("string response", function (done) {
            client.say = function (target, response) {
                try {
                    assert(channel === target);
                    assert(response === "response");
                    assert(arguments.length === 2);
                    done();   
                } catch (e) {
                    done(e);
                }
            };

            emitter.on("join", function () {
                return "response";
            });

            acceptData(raws.join);
        });

        it("[string] response", function (done) {
            client.say = function (target, response) {
                try {
                    assert(channel === target);
                    assert(equal(response, ["response"]));
                    assert(arguments.length === 2);
                    done();   
                } catch (e) {
                    done(e);
                }
            };

            emitter.on("join", function () {
                return ["response"];
            });

            acceptData(raws.join);
        });

        it("Promise<string> response", function (done) {
            client.say = function (target, response) {
                try {
                    assert(channel === target);
                    assert(response === "response");
                    assert(arguments.length === 2);
                    done();   
                } catch (e) {
                    done(e);
                }
            };

            emitter.on("join", function () {
                return Promise.resolve("response");
            });

            acceptData(raws.join);
        });

        it("Promise<[string]> response", function (done) {
            client.say = function (target, response) {
                try {
                    assert(channel === target);
                    assert(equal(response, ["response"]));
                    assert(arguments.length === 2);
                    done();   
                } catch (e) {
                    done(e);
                }
            };

            emitter.on("join", function () {
                return Promise.resolve(["response"]);
            });

            acceptData(raws.join);
        });

        it("Promise<string> after Promise#catch()", function (done) {
            const failHandler = function (command) {
                return Promise
                .reject(new Error())
                .catch(function (err) {
                    logfn("Returning sorry!");
                    return "Sorry!";
                });
            };

            client.say = function (channel, response) {
                try {
                    assert(response === "Sorry!");
                    done();   
                } catch (e) {
                    done(e);
                }
            };

            emitter.on("join", failHandler);

            acceptData(raws.join);
        });

        it.skip("Invalid response (string includes newlines)", function () {
            // Response = "abc\ndef"
        });
    });
});
