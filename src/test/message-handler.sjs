const sinon = require("sinon");
const assert = require("better-assert");
const equal = require("deep-eql");
const inspect = require("util").inspect;
const format = require("util").format;
require("source-map-support").install();

const debug = false;
const logfn = debug ? console.log.bind(console) : function () {};
const logger = {debug: logfn, info: logfn, notice: logfn, warn: logfn, error: logfn};

const MessageHandler = require("../lib/message-handler.js");
const Message = require("../lib/message.js");

const id = (function () {
    var ix = 0;
    return function () {
        ix += 1;
        return ix;
    }
})();

const prefix = "irc.mibbit.net";
const command = "generic";
const arg1 = "arg1";
const arg2 = "arg2";
const argr = "rest args";
const raw = format(":%s %s %s %s :%s", prefix, command, arg1, arg2, argr);

describe "Message Parsers" {
    var parser, receiver;

    beforeEach {
        receiver = {_id: id()};
        parser = MessageHandler(receiver, logger);
    }

    describe "#parse" {
        var retval, evtval;

        beforeEach {
            parser.on("generic", function (message) {
                evtval = message;
            });

            retval = parser.parse(raw);
        }

        it "Return value" {
            logfn(inspect(retval));
            assert(retval !== undefined);
            assert(retval.prefix === prefix);
            assert(retval.command === command);
            assert(retval.params[0] === arg1);
            assert(retval.params[1] === arg2);
            assert(retval.params[2] === argr);
        }

        it "Event Value" {
            assert(evtval.prefix === prefix);
            assert(evtval.command === command);
            assert(evtval.params[0] === arg1);
            assert(evtval.params[1] === arg2);
            assert(evtval.params[2] === argr);
        }

        it "Emit and Return value are the same" {
            assert(retval === evtval);
        }
    }

    describe "`*` event" {
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
}
