const sinon = require('sinon');
const assert = require('better-assert');
const equal = require('deep-eql');
const inspect = require('util').inspect;
const format = require('util').format;
require('source-map-support').install();

const debug = false;
const logfn = debug ? console.log.bind(console) : function () {};

const Response = require('../lib/response');

const message = {
    channel: "#channel",
    nickname: "sender"
};

// See https://tennu.github.io/documentation/api/response for user facing documentation.

describe "Response" {
    describe "Creation" {
        it "gives no response to an `undefined` value" {
            assert(equal(Response.create(undefined, message), {
                intent: "none",
                message: undefined,
                target: undefined
            }));
        }

        it "makes the intent 'say' for a String" {
            assert(equal(Response.create("Hello World!", message), {
                intent: "say",
                message: "Hello World!",
                target: "#channel"
            }));
        }

        it "makes the intent 'say' for an Array" {
            assert(equal(Response.create(["Hello", "World"], message), {
                intent: "say",
                message: ["Hello", "World"],
                target: "#channel"
            }));
        }

        describe "given an Object" {
            it "copies all the properties from an object with the same shape as a Response" {
                assert(equal(Response.create({
                    intent: "say",
                    message: "Goodbye World!",
                    target: "#channel"
                }, message), {
                    intent: "say",
                    message: "Goodbye World!",
                    target: "#channel"
                }));
            }

            it "copies all properties from an object with the same shape as a Response but changes target if 'query' is true" {
                assert(equal(Response.create({
                    intent: "say",
                    message: "Hello User!",
                    target: "#channel",
                    query: true
                }, message), {
                    intent: "say",
                    message: "Hello User!",
                    target: "sender"
                }));
            }

            it "missing a target with no or false query" {
                assert(equal(Response.create({
                    intent: "say",
                    message: "Hello Who?",
                }, message), {
                    intent: "say",
                    message: "Hello Who?",
                    target: "#channel"
                }));
            }

            it "missing an intent" {
                assert(equal(Response.create({
                    message: "Hello!",
                    target: "#channel"
                }, message), {
                    intent: "say",
                    message: "Hello!",
                    target: "#channel"
                }));
            }

            it "non-say intent" {
                assert(equal(Response.create({
                    intent: "act",
                    message: "does something.",
                    target: "#channel"
                }, message), {
                    intent: "act",
                    message: "does something.",
                    target: "#channel"
                }))
            }
        }
    }

    describe "Sending" {
        var client;

        beforeEach {
            client = {
                notice: sinon.spy(),
                say: sinon.spy(),
                act: sinon.spy(),
                ctcpRequest: sinon.spy(),
                ctcpRespond: sinon.spy(),
                warn: sinon.spy()
            }
        }

        it "with intent of 'none'" {
            Response.send({
                intent: "none",
                message: undefined,
                target: undefined
            }, client);

            assert(!client.notice.called);
            assert(!client.say.called);
            assert(!client.act.called);
            assert(!client.ctcpRequest.called);
            assert(!client.ctcpRespond.called);
        }

        it "with intent of 'notice'" {
            Response.send({
                intent: "notice",
                message: "Do you really want to know?",
                target: "sender"
            }, client);
            
            assert(!client.say.called);
            assert(!client.act.called);
            assert(!client.ctcpRequest.called);
            assert(!client.ctcpRespond.called);

            assert(client.notice.calledOnce);
            assert(client.notice.calledWithExactly("sender", "Do you really want to know?"));
        }

        it "with intent of 'say'" {
            Response.send({
                intent: "say",
                message: "Your bot greets you!",
                target: "#channel"
            }, client);
            
            assert(!client.notice.called);
            assert(!client.act.called);
            assert(!client.ctcpRequest.called);
            assert(!client.ctcpRespond.called);

            assert(client.say.calledOnce);
            assert(client.say.calledWithExactly("#channel", "Your bot greets you!"));
        }

        it "with intent of 'act'" {
            Response.send({
                intent: "act",
                message: "dances wildly!",
                target: "#channel"
            }, client);
            
            assert(!client.notice.called);
            assert(!client.say.called);
            assert(!client.ctcpRequest.called);
            assert(!client.ctcpRespond.called);

            assert(client.act.calledOnce);
            assert(client.act.calledWithExactly("#channel", "dances wildly!"));
        }

        it "with intent of 'ctcp' with body" {
            Response.send({
                intent: "ctcp",
                message: ["FINGER", "gives you the index finger!"],
                target: "sender"
            }, client);
            
            assert(!client.notice.called);
            assert(!client.say.called);
            assert(!client.act.called);
            assert(!client.ctcpRequest.called);

            assert(client.ctcpRespond.calledOnce);
            assert(client.ctcpRespond.calledWithExactly("sender", "FINGER", "gives you the index finger!"));

            // Because this intent is deprecated.
            assert(client.warn.calledOnce);
        }

        it "with intent of 'ctcp' without body" {
            Response.send({
                intent: "ctcp",
                message: ["VERSION"],
                target: "sender"
            }, client);
            
            assert(!client.notice.called);
            assert(!client.say.called);
            assert(!client.act.called);
            assert(!client.ctcpRespond.called);

            assert(client.ctcpRequest.calledOnce);
            assert(client.ctcpRequest.calledWithExactly("sender", "VERSION"));

            assert(client.warn.calledOnce);
        }

        it "with intent of 'ctcpRespond'" {
            Response.send({
                intent: "ctcp",
                message: ["FINGER", "gives you the index finger!"],
                target: "sender"
            }, client);
            
            assert(!client.notice.called);
            assert(!client.say.called);
            assert(!client.act.called);
            assert(!client.ctcpRequest.called);

            assert(client.ctcpRespond.calledOnce);
            assert(client.ctcpRespond.calledWithExactly("sender", "FINGER", "gives you the index finger!"));
        }

        it "with intent of 'ctcpRequest'" {
            Response.send({
                intent: "ctcp",
                message: ["VERSION"],
                target: "sender"
            }, client);
            
            assert(!client.notice.called);
            assert(!client.say.called);
            assert(!client.act.called);
            assert(!client.ctcpRespond.called);

            assert(client.ctcpRequest.calledOnce);
            assert(client.ctcpRequest.calledWithExactly("sender", "VERSION"));
        }
    }
}