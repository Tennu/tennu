const sinon = require("sinon");
const assert = require("better-assert");
const equal = require("deep-eql");
const inspect = require("util").inspect;
const format = require("util").format;
require("source-map-support").install();

const debug = false;
const logfn = debug ? console.log.bind(console) : function () {};

const ChannelPluginFactory = require("../tennu_plugins/channel.js");
const Message = require("../lib/message.js");

const create = function (prototype, properties) {
    const result = Object.create(prototype);

    Object.keys(properties).forEach(function (key) {
        result[key] = properties[key];
    });

    return result;
};

const server = "irc.test.net";
const self = {
    nickname: "me",
    username: "tennu",
    hostname: "tennu.net",
    hostmask: "me!tennu@tennu.net"
};
const other = {
    nickname: "other",
    username: "the-other",
    hostname: "other.net",
    hostmask: "other!the-other@other.net"
};
const channel_a = "#a";

describe("Channel Plugin", function () {
    var instance, client;

    beforeEach(function () {
        client = {
            nickname: function () { return "me"; },

            mode: function () {}
        };
        instance = ChannelPluginFactory.init(client, {});
    });

    it("without having joined any channels only has empty lists", function () {
        assert(equal([], instance.exports.all()));
        assert(equal([], instance.exports.chans()));
    });

    it("gathers minimal data when joining an empty unregistered channel", function () {
        // JOIN #a
        // :me!tennu@tennu.net JOIN :#a
        // :irc.test.net MODE #a +nt 
        // :irc.test.net 353 me = #a :@me 
        // :irc.test.net 366 me #a :End of /NAMES list.
        // mode #a b
        // :irc.test.net 368 Havvy2 #a :End of Channel Ban List
        // mode #a e
        // :irc.test.net 349 Havvy2 #a :End of Channel Exception List
        // mode #a I
        // :irc.test.net 347 Havvy2 #a :End of Channel Invite List
        // PART #a
        // :me!tennu@tennu.net PART #a
        // QUIT
        // ERROR :Closing Link: me[localhost@tennu.net] (Quit: me)

        instance.handlers.join(Message(format(":%s JOIN %s", self.hostmask, channel_a)));
        const channel = instance.exports.get("#a");
        logfn(inspect(channel));
        assert(equal(channel, create(Object.getPrototypeOf(channel), {
            name: "#a",
            users: {},
            topic: "",
            topicHistory: [],
            banList: {},
            exceptList: {},
            inviteList: {},
            modes: { v: {}, h: {}, o: {}, a: {}, q: {}, b: {}, e: {}, I: {} }
        })));
        assert(equal(["#a"], instance.exports.all()));
        assert(equal([channel], instance.exports.chans()));

        instance.handlers.mode(Message(format(":%s MODE %s +nt", server, channel_a)));
        logfn(inspect(channel));
        assert(equal(channel, create(Object.getPrototypeOf(channel), {
            name: "#a",
            users: {},
            topic: "",
            topicHistory: [],
            banList: {},
            exceptList: {},
            inviteList: {},
            modes: { v: {}, h: {}, o: {}, a: {}, q: {}, b: {}, e: {}, I: {}, n: true, t: true }
        })));
        assert(equal(["#a"], instance.exports.all()));
        assert(equal([channel], instance.exports.chans()));

        instance.handlers["353"](Message(format(":%s 353 %s = %s :@%s", server, self.nickname, channel_a, self.nickname)));
        logfn(inspect(channel));
        assert(equal(channel, create(Object.getPrototypeOf(channel), {
            name: "#a",
            users: { "me": "me" },
            topic: "",
            topicHistory: [],
            banList: {},
            exceptList: {},
            inviteList: {},
            modes: { v: {}, h: {}, o: { "me": undefined }, a: {}, q: {}, b: {}, e: {}, I: {}, n: true, t: true }
        })));
        assert(equal(["#a"], instance.exports.all()));
        assert(equal([channel], instance.exports.chans()));

        instance.handlers.part(Message(format(":%s PART %s", self.hostmask, channel_a)));
        assert(equal([], instance.exports.all()));
        assert(equal([], instance.exports.chans()));
    });

    it("joining unregistered channel, and then opping and de-opping user who joins after", function () {
        // JOIN #a
        // :me!tennu@tennu.net JOIN :#a
        // :irc.test.net MODE #a +nt 
        // :irc.test.net 353 me = #a :@me 
        // :irc.test.net 366 me #a :End of /NAMES list.
        // mode #a b
        // :irc.test.net 368 Havvy2 #a :End of Channel Ban List
        // mode #a e
        // :irc.test.net 349 Havvy2 #a :End of Channel Exception List
        // mode #a I
        // :irc.test.net 347 Havvy2 #a :End of Channel Invite List
        // JOIN #a
        // :other!the-other@other.net JOIN :#a
        // MODE #a +o other
        // :me!tennu@tennu.net MODE #a +o other
        // MODE #a -o other
        // :me!tennu@tennu.net MODE #a -o other
        // PART #a
        // :me!tennu@tennu.net PART #a
        // QUIT
        // ERROR :Closing Link: me[localhost@tennu.net] (Quit: me)

        instance.handlers.join(Message(format(":%s JOIN %s", self.hostmask, channel_a)));
        const channel = instance.exports.get("#a");
        instance.handlers.mode(Message(format(":%s MODE %s +nt", server, channel_a)));
        instance.handlers["353"](Message(format(":%s 353 %s = %s :@%s", server, self.nickname, channel_a, self.nickname)));

        instance.handlers.join(Message(format(":%s JOIN %s", other.hostmask, channel_a)));
        logfn(inspect(channel));
        assert(equal(channel, create(Object.getPrototypeOf(channel), {
            name: "#a",
            users: { "me": "me", "other": "other" },
            topic: "",
            topicHistory: [],
            banList: {},
            exceptList: {},
            inviteList: {},
            modes: { v: {}, h: {}, o: { "me": undefined }, a: {}, q: {}, b: {}, e: {}, I: {}, n: true, t: true }
        })));

        instance.handlers.mode(Message(format(":%s MODE %s +o %s", self.hostmask, channel_a, other.nickname)));
        logfn(inspect(channel));
        assert(equal(channel, create(Object.getPrototypeOf(channel), {
            name: "#a",
            users: { "me": "me", "other": "other" },
            topic: "",
            topicHistory: [],
            banList: {},
            exceptList: {},
            inviteList: {},
            modes: { v: {}, h: {}, o: { "me": undefined, "other": "me" }, a: {}, q: {}, b: {}, e: {}, I: {}, n: true, t: true }
        })));

        instance.handlers.mode(Message(format(":%s MODE %s -o %s", self.hostmask, channel_a, other.nickname)));
        logfn(inspect(channel));
        assert(equal(channel, create(Object.getPrototypeOf(channel), {
            name: "#a",
            users: { "me": "me", "other": "other" },
            topic: "",
            topicHistory: [],
            banList: {},
            exceptList: {},
            inviteList: {},
            modes: { v: {}, h: {}, o: { "me": undefined }, a: {}, q: {}, b: {}, e: {}, I: {}, n: true, t: true }
        })));

        instance.handlers.part(Message(format(":%s PART %s", self.hostmask, channel_a)));
    });
});
