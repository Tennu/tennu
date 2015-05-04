const sinon = require("sinon");
const assert = require("better-assert");
const equal = require("deep-eql");
const inspect = require("util").inspect;
const format = require("util").format;
require("source-map-support").install();
const defaults = require("lodash.defaults");

const debug = false;
const logfn = debug ? console.log.bind(console) : function () {};
const logger = {debug: logfn, info: logfn, notice: logfn, warn: logfn, error: logfn, crit: logfn, alert: logfn, emerg: logfn};

const Client = require("../lib/client.js");
const NetSocket = require("@havvy/mock-net-socket");

const networkConfig = {
    "server": "irc.test.net",
    "nicknames": ["testbot"],
    "username": "testuser",
    "realname": "tennu irc bot"
};

const messages = {
    rpl_welcome: ":irc.test.net 001 testbot :Welcome to the Test IRC Network testbot!testuser@localhost\r\n",
    rpl_cap_ls: ":irc.test.net CAP * LS :multi-prefix\r\n",
    rpl_ack_default_capabilities: ":irc.test.net CAP * ACK :multi-prefix\r\n",
    _: ""
};

const boxfn = function (value) {
    return function () { return value; };
};

describe "Tennu Client:" {
    var netsocket, client;

    beforeEach {
        netsocket = NetSocket(logfn);
    }

    it "Basic Connecting and Disconnecting" {
        client = Client(networkConfig, {
            NetSocket: boxfn(netsocket),
            Logger: boxfn(logger)
        });

        assert(client.connected === false);
        client.connect();
        assert(client._socket.isStarted() === true);
        assert(client._socket.isReady() === false);
        assert(client.connected === true);
        client.disconnect();
        assert(client.connected === false);
    }

    // TODO(Havvy): Move this to a test for the Self plugin.
    describe "Self plugin:" {
        beforeEach (done) {
            client = Client(networkConfig, {
                NetSocket: boxfn(netsocket),
                Logger: boxfn(logger)
            });

            netsocket.on("connect", done);
            client.connect();
            client._socket.impl.acceptConnect();
        }

        afterEach (done) {
            netsocket.on("close", done);
            client.disconnect();
        }

        it "does not know its nickname until startup finishes" {
            assert(client.nickname() === undefined);
        }

        it "tracks its initial nickname" (done) {
            assert(client._socket.impl.write.getCall(0).calledWithExactly("CAP LS\r\n", "utf-8"));
            client._socket.impl.acceptData(messages.rpl_cap_ls);
            assert(client._socket.impl.write.getCall(1).calledWithExactly("CAP REQ :multi-prefix\r\n", "utf-8"));
            client._socket.impl.acceptData(messages.rpl_ack_default_capabilities);
            assert(client._socket.impl.write.getCall(2).calledWithExactly("CAP END\r\n", "utf-8"));
            assert(client._socket.impl.write.getCall(3).calledWithExactly("USER testuser 8 * :tennu irc bot\r\n", "utf-8"));
            assert(client._socket.impl.write.getCall(4).calledWithExactly("NICK testbot\r\n", "utf-8"));
            client._socket.impl.acceptData(messages.rpl_welcome);

            client._socket.startupPromise.then(function () {
                setImmediate(function () {
                    assert(client.nickname() === "testbot");
                    done();
                });
            });
        }

        it "tracks its changed nick" {
            assert(client._socket.impl.write.getCall(0).calledWithExactly("CAP LS\r\n", "utf-8"));
            client._socket.impl.acceptData(messages.rpl_cap_ls);
            assert(client._socket.impl.write.getCall(1).calledWithExactly("CAP REQ :multi-prefix\r\n", "utf-8"));
            client._socket.impl.acceptData(messages.rpl_ack_default_capabilities);
            assert(client._socket.impl.write.getCall(2).calledWithExactly("CAP END\r\n", "utf-8"));
            assert(client._socket.impl.write.getCall(3).calledWithExactly("USER testuser 8 * :tennu irc bot\r\n", "utf-8"));
            assert(client._socket.impl.write.getCall(4).calledWithExactly("NICK testbot\r\n", "utf-8"));
            client._socket.impl.acceptData(messages.rpl_welcome);

            return client._socket.startupPromise
            .then(function () {}) // skip a turn.
            .then(function () {
                client.nick("changed-nick")
                assert(client._socket.impl.write.getCall(5).calledWithExactly("NICK changed-nick\r\n", "utf-8"));
                client._socket.impl.acceptData(":testbot!testuser@user.isp.net NICK changed-nick\r\n");
            })
            .then(function () {})
            .then(function () {
                assert(client.nickname() === "changed-nick");
            });
        }
    }

    // TODO(havvy): Move to own file.
    describe "Startup Plugin" {

        afterEach (done) {
            netsocket.on("close", done);
            client.disconnect();
        }

        describe "autojoin" {
            it "automatically joins specified channels." (done) {
                client = Client(defaults({channels: ["#test"]}, networkConfig), {
                    NetSocket: boxfn(netsocket),
                    Logger: boxfn(logger)
                });

                client.connect();

                client._socket.impl.acceptConnect();
                assert(client._socket.impl.write.getCall(0).calledWithExactly("CAP LS\r\n", "utf-8"));
                client._socket.impl.acceptData(messages.rpl_cap_ls);
                assert(client._socket.impl.write.getCall(1).calledWithExactly("CAP REQ :multi-prefix\r\n", "utf-8"));
                client._socket.impl.acceptData(messages.rpl_ack_default_capabilities);
                assert(client._socket.impl.write.getCall(2).calledWithExactly("CAP END\r\n", "utf-8"));
                assert(client._socket.impl.write.getCall(3).calledWithExactly("USER testuser 8 * :tennu irc bot\r\n", "utf-8"));
                assert(client._socket.impl.write.getCall(4).calledWithExactly("NICK testbot\r\n", "utf-8"));
                client._socket.impl.acceptData(messages.rpl_welcome);

                client._socket.impl.write.on(5, function (spyCall) {
                    assert(spyCall.calledWithExactly("JOIN :#test\r\n", "utf-8"));
                    // client._socket.impl.acceptData(messages.join_test);
                    // client._socket.impl.acceptData(messages.rpl_topic_test);
                    // client._socket.impl.acceptData(messages.rpl_topicwhotime_test);
                    // client._socket.impl.acceptData(messages.rpl_names_test);
                    // client._socket.impl.acceptData(messages.rpl_endofnames_test);
                    done();
                });
            }
        }

        describe "autoidentify" {
            it "automatically identifies to services." (done) {
                var config = defaults({
                    "nickserv": "nickserv",
                    "auth-password": "123456"
                }, networkConfig);

                client = Client(config, {
                    NetSocket: boxfn(netsocket),
                    Logger: boxfn(logger)
                });

                client.connect();

                client._socket.impl.acceptConnect();
                assert(client._socket.impl.write.getCall(0).calledWithExactly("CAP LS\r\n", "utf-8"));
                client._socket.impl.acceptData(messages.rpl_cap_ls);
                assert(client._socket.impl.write.getCall(1).calledWithExactly("CAP REQ :multi-prefix\r\n", "utf-8"));
                client._socket.impl.acceptData(messages.rpl_ack_default_capabilities);
                assert(client._socket.impl.write.getCall(2).calledWithExactly("CAP END\r\n", "utf-8"));
                assert(client._socket.impl.write.getCall(3).calledWithExactly("USER testuser 8 * :tennu irc bot\r\n", "utf-8"));
                assert(client._socket.impl.write.getCall(4).calledWithExactly("NICK testbot\r\n", "utf-8"));
                client._socket.impl.acceptData(messages.rpl_welcome);

                client._socket.impl.write.on(5, function (spyCall) {
                    assert(spyCall.calledWithExactly("PRIVMSG nickserv :identify 123456\r\n", "utf-8"));
                    done();
                });
            }
        }

        // When ERROR is sent before 001.
        it skip "does not do post-startup tasks if server never started" {}
        it skip "tells you why startup failed when it fails" {}
    }

    describe "Error handling" {
        it "tells you which methods are missing on the logger" {
            var config = networkConfig

            try {
                Client(networkConfig, {
                    Logger: function () {
                        return {debug: logfn, info: logfn, notice: logfn, warn: logfn, error: logfn};
                    }
                });

                assert(false);
            } catch (e) {
                logfn(e.message);
                assert(e.message === "Logger passed to tennu.Client is missing the following methods: [ 'crit', 'alert', 'emerg' ]");
            }
        }
    }

    describe "Capabilities always requires `multi-prefix`" {
        it "even when no capabilities passed" {
            var client = Client(networkConfig, {
                NetSocket: boxfn(netsocket),
                Logger: boxfn(logger)
            });

            client.connect();

            client._socket.impl.acceptConnect();
            assert(client._socket.impl.write.getCall(0).calledWithExactly("CAP LS\r\n", "utf-8"));
            client._socket.impl.acceptData(messages.rpl_cap_ls);
            assert(client._socket.impl.write.getCall(1).calledWithExactly("CAP REQ :multi-prefix\r\n", "utf-8"));
            client._socket.impl.acceptData(messages.rpl_ack_default_capabilities);
        }

        it "even when capabilities is passed without a requires property" {
            var config = defaults({capabilities: {}}, networkConfig);
            var client = Client(config, {
                NetSocket: boxfn(netsocket),
                Logger: boxfn(logger)
            });

            client.connect();
            client._socket.impl.acceptConnect();
            assert(client._socket.impl.write.getCall(0).calledWithExactly("CAP LS\r\n", "utf-8"));
            client._socket.impl.acceptData(messages.rpl_cap_ls);
            assert(client._socket.impl.write.getCall(1).calledWithExactly("CAP REQ :multi-prefix\r\n", "utf-8"));
            client._socket.impl.acceptData(messages.rpl_ack_default_capabilities);
        }

        it "event when capabilities is passed a requires array property without them" {
            var config = defaults({ capabilities: { requires: [] } }, networkConfig);
            var client = Client(config, {
                NetSocket: boxfn(netsocket),
                Logger: boxfn(logger)
            });

            client.connect();
            client._socket.impl.acceptConnect();
            assert(client._socket.impl.write.getCall(0).calledWithExactly("CAP LS\r\n", "utf-8"));
            client._socket.impl.acceptData(messages.rpl_cap_ls);
            assert(client._socket.impl.write.getCall(1).calledWithExactly("CAP REQ :multi-prefix\r\n", "utf-8"));
            client._socket.impl.acceptData(messages.rpl_ack_default_capabilities);
        }
    }
}