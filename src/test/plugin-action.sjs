const sinon = require("sinon");
const assert = require("better-assert");
const equal = require("deep-eql");
const inspect = require("util").inspect;
const format = require("util").format;
require("source-map-support").install();

const debug = false;
const logfn = debug ? console.log.bind(console) : function () {};
const logger = {
    debug: logfn, info: logfn, notice: logfn, warn: logfn,
    error: function (plugin, message) {logfn(plugin, message); assert(message !== false);}
};

const channel = "#test";
const nickname = "testbot";

const nicknamefn = function () { return nickname; };

const ActionPluginFactory = require("../tennu_plugins/action");
const EventEmitter = require("after-events");

describe("IRC Output Socket:", function () {
    var socket, actionPlugin, out, messageHandler;

    beforeEach(function () {
        logfn(/* newline */);
        messageHandler = new EventEmitter();
        socket = { raw: sinon.spy() };
        actionPlugin = ActionPluginFactory.init({
            _socket: socket,
            //messageHandler,
            nickname: nicknamefn,
            debug: logfn,
            info: logfn,
            note: logfn,
            error: logfn,
            on: function (handlers) {
                Object.keys(handlers).forEach(function (key) {
                    messageHandler.on(key, handlers[key]);
                });
            },

            off: function (handlers) {
                Object.keys(handlers).forEach(function (key) {
                    messageHandler.off(key, handlers[key]);
                });
            }
        });

        out = actionPlugin.exports;
    });

    describe("Join", function () {
        describe("A single channel", function () {
            it("resolves to Ok(JoinInfo) when succeeded", function () {
                // JOIN #success
                // :testbot!tennu@tennu.github.io JOIN :#success
                // :irc.server.net 332 testbot #success :Topic for #success.
                // :irc.server.net 333 testbot #success topic-changer 1333333333
                // :irc.server.net 353 testbot @ #success :testbot @topic-changer other-user
                // :irc.server.net 366 testbot #success :End of /NAMES list.
                const channel = "#success";
                const topic = "Topic for #success.";
                const topicSetter = "topic-changer";
                const topicSetTimestamp = 1333333333;
                const nicknames = ["testbot", "@topic-changer", "other-user"];

                const joinmsg = {nickname: nickname, channel: channel};
                const topicmsg = {channel: channel, topic: topic};
                const topicwhotimemsg = {channel: channel, who: topicSetter, timestamp: topicSetTimestamp};
                const namesmsg = {channel: channel, nicknames: nicknames};
                const endofnamesmsg = {channel: channel};

                var promise = out.join(channel)
                .then(function (result) {
                    assert(result.isOk());
                    const joinInfo = result.ok();
                    logfn(inspect(joinInfo));
                    // TODO: Is that actually the right format to raw?
                    assert(socket.raw.calledWithExactly(format("JOIN :%s", channel)));
                    assert(joinInfo.channel === channel);
                    assert(joinInfo.nickname === nickname);
                    assert(equal(joinInfo.names, nicknames));
                    assert(equal(joinInfo.topic, {
                        topic: topic,
                        setter: topicSetter,
                        timestamp: topicSetTimestamp
                    }));
                });

                messageHandler.emit("join", joinmsg);
                messageHandler.emit("rpl_topic", topicmsg);
                messageHandler.emit("rpl_topicwhotime", topicwhotimemsg);
                messageHandler.emit("rpl_namreply", namesmsg);
                messageHandler.emit("rpl_endofnames", endofnamesmsg);

                return promise;
            });

            it("can handle multiple RPL_NAMREPLYs", function () {
                // JOIN #success
                // :testbot!tennu@tennu.github.io JOIN :#success
                // :irc.server.net 332 testbot #success :Topic for #success.
                // :irc.server.net 333 testbot #success topic-changer 1333333333
                // :irc.server.net 353 testbot @ #success :testbot
                // :irc.server.net 353 testbot @ #success :@topic-changer
                // :irc.server.net 353 testbot @ #success :other-user
                // :irc.server.net 366 testbot #success :End of /NAMES list.
                const channel = "#success";
                const topic = "Topic for #success.";
                const topicSetter = "topic-changer";
                const topicSetTimestamp = 1333333333;
                const nicknames = ["testbot", "@topic-changer", "other-user"];

                const joinmsg = {nickname: nickname, channel: channel};
                const topicmsg = {channel: channel, topic: topic};
                const topicwhotimemsg = {channel: channel, who: topicSetter, timestamp: topicSetTimestamp};
                const endofnamesmsg = {channel: channel};

                var promise = out.join(channel)
                .then(function (result) {
                    assert(result.isOk());
                    const joinInfo = result.ok();
                    logfn(inspect(joinInfo));
                    // TODO: Is that actually the right format to raw?
                    assert(socket.raw.calledWithExactly(format("JOIN :%s", channel)));
                    assert(joinInfo.channel === channel);
                    assert(joinInfo.nickname === nickname);
                    assert(equal(joinInfo.names, nicknames));
                    assert(equal(joinInfo.topic, {
                        topic: topic,
                        setter: topicSetter,
                        timestamp: topicSetTimestamp
                    }));
                });

                messageHandler.emit("join", joinmsg);
                messageHandler.emit("rpl_topic", topicmsg);
                messageHandler.emit("rpl_topicwhotime", topicwhotimemsg);
                nicknames.forEach(function (nickname) {
                    messageHandler.emit("rpl_namreply", {channel: channel, nicknames: [nickname] });
                });
                messageHandler.emit("rpl_endofnames", endofnamesmsg);

                return promise;
            });

            it("resolves to Fail(Numeric403Message) trying to join a non-existent channel", function () {
                // JOIN not_a_channel
                //:irc.server.net 403 testbot not_a_channel :No such channel
                const channel = "not_a_channel";

                const nosuchchannelmsg = {nickname: nickname, channel: channel};

                var promise = out.join(channel)
                .then(function (result) {
                    assert(result.isFail());
                    const failMessage = result.fail();
                    logfn(inspect(failMessage));
                    assert(failMessage === nosuchchannelmsg);
                });

                messageHandler.emit("err_nosuchchannel", nosuchchannelmsg);

                return promise;
            });

            it("resolves to Fail(Numeric471Message) trying to join a full channel", function () {
                // JOIN #full
                // :irc.server.net 471 testbot #full :Cannot join channel (+i)
                const channel = "#full";

                const fullmsg = {nickname: nickname, channel: channel};

                var promise = out.join(channel)
                .then(function (result) {
                    assert(result.isFail());
                    const failMessage = result.fail();
                    logfn(inspect(failMessage));
                    assert(failMessage === fullmsg);
                });

                messageHandler.emit("err_channelisfull", fullmsg);

                return promise;
            });

            it("resolves to Fail(Numeric473Message) trying to join an invite only channel bot is not invited to", function () {
                // JOIN #invite_only
                // :irc.server.net 473 testbot #invite_only :Cannot join channel (+i)
                const channel = "#invite_only";

                const inviteonlymsg = {nickname: nickname, channel: channel};

                var promise = out.join(channel)
                .then(function (result) {
                    assert(result.isFail());
                    const failMessage = result.fail();
                    logfn(inspect(failMessage));
                    assert(failMessage === inviteonlymsg);
                });

                messageHandler.emit("err_inviteonlychan", inviteonlymsg);

                return promise;
            });

            it("resolves to Fail(Numeric474Message) trying to join a message bot is banned in", function () {
                // JOIN #banned
                // :irc.server.net 474 testbot #banned :Cannot join channel (+b)
                const channel = "#banned";

                const bannedmsg = {nickname: nickname, channel: channel};

                var promise = out.join(channel)
                .then(function (result) {
                    assert(result.isFail());
                    const failMessage = result.fail();
                    logfn(inspect(failMessage));
                    assert(failMessage === bannedmsg);
                });

                messageHandler.emit("err_bannedfromchan", bannedmsg);

                return promise;
            });

            it("resolves to Fail(Numeric475Message) trying to join a channel with the wrong channel key", function () {
                // JOIN #private
                // :irc.server.net 475 testbot #private :Cannot join channel (+k)
                const channel = "#private";

                const badkeymsg = {nickname: nickname, channel: channel};

                var promise = out.join(channel)
                .then(function (result) {
                    assert(result.isFail());
                    const failMessage = result.fail();
                    logfn(inspect(failMessage));
                    assert(failMessage === badkeymsg);
                });

                messageHandler.emit("err_badchannelkey", badkeymsg);

                return promise;
            });

            it("resolves to Fail(Numeric520Message) trying to join an oper only channel", function () {
                // JOIN #oper
                // :irc.server.net 520 testbot :Cannot join channel #oper (IRCops only)

                const channel = "#oper";

                const openonlymsg = {nickname: nickname, channel: channel};

                var promise = out.join(channel)
                .then(function (result) {
                    assert(result.isFail());
                    const failMessage = result.fail();
                    logfn(inspect(failMessage));
                    assert(failMessage === openonlymsg);
                });

                messageHandler.emit("err_operonly", openonlymsg);

                return promise;
            });
        });

        describe.skip("channel keys", function () {});
        describe.skip("Interleaved joins", function () {});

        describe("timeouts", function () {
            var clock;

            beforeEach(function () {
                clock = sinon.useFakeTimers();
            });

            afterEach(function () {
                clock.restore();
            });

            it("cause rejection of the promise", function (done) {
                // Note: This should never happen. But if it does...
                // JOIN #channel
                // <silence>

                out.join("#channel")
                .then(done) // done with a value fails the test.
                .catch(function (err) {
                    assert(err instanceof Error);
                    done();
                });

                clock.tick(60 * 60 * 1000 + 1);
            });
        });

        describe("Multiple channels", function () {
            it.skip("returns an array of Result<JoinInfo, JoinFailureMessage>s", function () {});
        });
    });

    describe("Whois", function () {
        // Maybe this should be Nicky instead?
        function emitWhoisNicknameResponse (messageHandler, nickname) {
            // Default to nickname "nickname".
            nickname = nickname || "nickname";

            // WHOIS nickname
            // :irc.server.net 311 testbot nickname username hostname.net * :Real name
            // :irc.server.net 313 testbot nickname irc.server.net :A test server
            // :irc.server.net 317 testbot nickname 57895 1465689648 :seconds idle, signon time
            // :irc.server.net 318 testbot nickname :End of /WHOIS list.
            messageHandler.emit("rpl_whoisuser", {
                replyname: "RPL_WHOISUSER",
                nickname: nickname,
                username: "username",
                hostname: "hostname.net",
                realname: "Real name",
                hostmask: {
                    nickname: nickname,
                    username: "username",
                    hostname: "hostname.net"
                }
            });

            messageHandler.emit("rpl_whoisserver", {
                nickname: nickname,
                server: "irc.server.net",
                serverInfo: "A test server"
            });

            messageHandler.emit("rpl_whoisidle", {
                nickname: nickname,
                seconds: 123,
                since: 456
            });

            messageHandler.emit("rpl_endofwhois", {
                nickname: nickname
            });
        }

        describe("A single user", function () {
            it("resolves to Ok(WhoisInfo) when succeeded", function () {
                const whoisPromise = out.whois("nickname")
                .then(function (whoisResult) {
                    assert(whoisResult.isOk());

                    const whois = whoisResult.ok();

                    assert(whois.nickname === "nickname");
                    assert(whois.username === "username");
                    assert(whois.hostname === "hostname.net");
                    assert(equal(whois.hostmask, {
                        nickname: "nickname",
                        username: "username",
                        hostname: "hostname.net"
                    }));
                    assert(whois.realname === "Real name");
                    assert(!whois.identified);
                    assert(whois.identifiedas === undefined);
                    assert(whois.server === "irc.server.net");
                    assert(whois.serverInfo === "A test server");
                    assert(whois.idleSeconds === 123);
                    assert(whois.loginTimestamp === 456);
                    assert(!whois.secureConnection);
                    assert(!whois.isBot);
                    assert(!whois.isHelpop);
                    assert(!whois.isOper);
                });

                messageHandler.emit("rpl_whoisuser", {
                    replyname: "RPL_WHOISUSER",
                    nickname: "nickname",
                    username: "username",
                    hostname: "hostname.net",
                    realname: "Real name",
                    hostmask: {
                        nickname: "nickname",
                        username: "username",
                        hostname: "hostname.net"
                    }
                });

                messageHandler.emit("rpl_whoisserver", {
                    nickname: "nickname",
                    server: "irc.server.net",
                    serverInfo: "A test server"
                });

                messageHandler.emit("rpl_whoisidle", {
                    nickname: "nickname",
                    seconds: 123,
                    since: 456
                });

                messageHandler.emit("rpl_endofwhois", {
                    nickname: "nickname"
                });

                return whoisPromise;
            });

            describe("Identifying", function () {
                it.skip("JoinInfo has `\"identified\": false` when user is not identified", function () {});
                it.skip("JoinInfo has `\"identified\": true, \"identifiedas\": nickname` when user is identified (307)", function () {});
                it.skip("JoinInfo has `\"identified\": true, \"identifiedas\": accountname` when user is identified (330)", function () {});
            });
            it.skip("resolves to Fail(Numeric421Message) if WHOIS command is unrecognized (e.g. on Twitch.tv)", function () {});
            it.skip("resovles to Fail(Numeric401Message) if WHOIS non-existent nickname", function () {});
        });

        describe("memoization", function () {
            it("can avoid a whois if memoized over an object of the caller's choice", function () {
                // In a real case, this would be a PRIVMSG about the user.
                const memoizationKey = {};
                var whoisResult1;

                const whoisPromise = out.whois("nickname", false, {memoizeOver: memoizationKey})
                .then(function (whoisResult) {
                    whoisResult1 = whoisResult;

                    return out.whois("nickname", false, {memoizeOver: memoizationKey});
                })
                .then(function (whoisResult) {
                    assert(whoisResult1 === whoisResult);
                    assert(socket.raw.calledOnce);
                });

                emitWhoisNicknameResponse(messageHandler);

                return whoisPromise;
            });

            it("will only avoid the whois request if the memoizeOver object is the same", function () {
                const memoizationKey1 = {};
                const memoizationKey2 = {};
                var whoisResult1;

                const whoisPromise = out.whois("nickname", false, {memoizeOver: memoizationKey1})
                .then(function (whoisResult) {
                    whoisResult1 = whoisResult;
                    const whoisPromise2 = out.whois("nickname", false, {memoizeOver: memoizationKey2});
                    emitWhoisNicknameResponse(messageHandler);
                    return whoisPromise2;
                })
                .then(function (whoisResult) {
                    assert(whoisResult1 !== whoisResult);
                    assert(socket.raw.calledTwice);
                });

                emitWhoisNicknameResponse(messageHandler);
                return whoisPromise;
            });

            it("will not memoize if there is no memoizeOver object", function () {
                var whoisResult1;

                const whoisPromise = out.whois("nickname")
                .then(function (whoisResult) {
                    whoisResult1 = whoisResult;
                    const whoisPromise2 = out.whois("nickname");
                    emitWhoisNicknameResponse(messageHandler);
                    return whoisPromise2;
                })
                .then(function (whoisResult) {
                    assert(whoisResult1 !== whoisResult);
                    assert(socket.raw.calledTwice);
                });

                emitWhoisNicknameResponse(messageHandler);
                return whoisPromise;
            });

            it("will not send whois results for different nicknames and same memoization object", function () {
                const memoizationKey = {};
                var whoisResult1;

                const whoisPromise = out.whois("nickname", false, {memoizeOver: memoizationKey})
                .then(function (whoisResult) {
                    whoisResult1 = whoisResult;

                    const whoisPromise = out.whois("nickname2", false, {memoizeOver: memoizationKey});
                    emitWhoisNicknameResponse(messageHandler, "nickname2");
                })
                .then(function (whoisResult) {
                    assert(whoisResult1 !== whoisResult);
                    assert(socket.raw.calledTwice);
                });

                emitWhoisNicknameResponse(messageHandler);

                return whoisPromise;
            });
        });

        describe.skip("timeouts", function () {});
    });

    describe("Mode", function () {
        it("can set a single mode with an argument", function () {
            out.mode("#test", "v", "", "SomeUser");
            logfn(format("'%s'", socket.raw.firstCall.args.join("', '")));
            assert(socket.raw.calledWithExactly("MODE #test :+v SomeUser"));
        });

        it("can set a single usermode without an argument", function () {
            out.mode("myself", "B");
            logfn(format("'%s'", socket.raw.firstCall.args.join("', '")));
            assert(socket.raw.calledWithExactly("MODE myself :+B"));
        });
    });

    it("can send private messages", function () {
        out.say("#test", "Hi");
        assert(socket.raw.calledWithExactly("PRIVMSG #test :Hi"));
    });

    it("can quit without a reason", function () {
        out.quit();
        assert(socket.raw.calledWithExactly("QUIT"));
    });

    it("can quit with a reason", function () {
        out.quit("the reason");
        assert(socket.raw.calledWithExactly("QUIT :the reason"));
    });

    describe("Part", function () {
        it("can part without a reason", function () {
            var promise = out.part("#test");
            assert(socket.raw.calledWithExactly("PART #test"));
            messageHandler.emit("part", {channel: "#test", nickname: "testbot"});
            return promise;
        });

        it("can part with a reason", function () {
            var promise = out.part("#test", "the reason");
            assert(socket.raw.calledWithExactly("PART #test :the reason"));
            messageHandler.emit("part", {channel: "#test", nickname: "testbot"});
            return promise;
        });

        it.skip("parting successfully resolves to Ok(PartInfo)", function () {});
        it.skip("parting non-existent channel resolves to Fail(NoSuchChannelMessage)", function () {});
        it.skip("parting channel not in resolves to Fail(NotInChannelMessage)", function () {});
    });

    describe("Kick", function () {
        it("with a reason", function () {
            out.kick("#test", "user", "naughty naughty");
            assert(socket.raw.calledWithExactly("KICK #test user :naughty naughty"));
        });

        it("without a reason", function () {
            out.kick("#test", "user");
            assert(socket.raw.calledWithExactly("KICK #test user"));
        });
    });

    describe("Ctcp", function () {
        it("can send a ctcp request", function () {
            out.ctcpRequest("user", "VERSION");
            assert(socket.raw.calledWithExactly("PRIVMSG user :\u0001VERSION\u0001"));
        });

        it("can send a ctcp response", function () {
            out.ctcpRespond("user", "VERSION", "Tennu test version");
            assert(socket.raw.calledWithExactly("NOTICE user :\u0001VERSION Tennu test version\u0001"));
        });

        it("capitalizes the CTCP tag", function () {
            out.ctcpRequest("user", "version");
            assert(socket.raw.calledWithExactly("PRIVMSG user :\u0001VERSION\u0001"));
        });
    });

    describe("EventEmitter", function () {
        it("emits the resolved promise as an event", function (done) {
            const emitter = out.emitter;

            emitter.on("join", function (joinInfoResult) {
                assert(joinInfoResult.isOk());
                done();
            });

            // The rest of this was copied from
            // "resolves to Ok(JoinInfo) when succeeded"
            // with the Promise based code removed.

            // JOIN #success
            // :testbot!tennu@tennu.github.io JOIN :#success
            // :irc.server.net 332 testbot #success :Topic for #success.
            // :irc.server.net 333 testbot #success topic-changer 1333333333
            // :irc.server.net 353 testbot @ #success :testbot @topic-changer other-user
            // :irc.server.net 366 testbot #success :End of /NAMES list.
            const channel = "#success";
            const topic = "Topic for #success.";
            const topicSetter = "topic-changer";
            const topicSetTimestamp = 1333333333;
            const nicknames = ["testbot", "@topic-changer", "other-user"];

            const joinmsg = {nickname: nickname, channel: channel};
            const topicmsg = {channel: channel, topic: topic};
            const topicwhotimemsg = {channel: channel, who: topicSetter, timestamp: topicSetTimestamp};
            const namesmsg = {channel: channel, nicknames: nicknames};
            const endofnamesmsg = {channel: channel};

            out.join(channel);
            messageHandler.emit("join", joinmsg);
            messageHandler.emit("rpl_topic", topicmsg);
            messageHandler.emit("rpl_topicwhotime", topicwhotimemsg);
            messageHandler.emit("rpl_namreply", namesmsg);
            messageHandler.emit("rpl_endofnames", endofnamesmsg);
        });

        it("annouces itself as part of the 'subscribe' hook", function () {
            assert(actionPlugin.subscribe.emitter === out.emitter);
            assert(actionPlugin.subscribe.prefix === "action:");
        });
    });
});