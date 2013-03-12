var Message = require('../lib/structures/message');
var Hostmask = require('../lib/structures/hostmask');
var receiver = {_id: require('./id')(), nick: function () { return "tnick"; }};

var hostmask = "sender!malicious@test.suite.net";
var nick = "buddy";
var server = "server.network.net";

var input = {
  generic: ':' + server + " GENERIC argument-one argument-two :rest arguments",
  chanmsg: [":" + hostmask, "PRIVMSG", "#channel", ":somebody said something"].join(' '),
  nosender: "GENERIC a1 a2 :rest args",
  query: ":" + hostmask + " PRIVMSG " + receiver.nick() + " :hi hi"
};

describe('static methods', function staticMethods () {
  it('hasSender determines if a message has a sender', function () {
    expect(Message.hasSender(input.generic)).toBeTruthy();
    expect(Message.hasSender(input.chanmsg)).toBeTruthy();
    expect(Message.hasSender(input.nosender)).not.toBeTruthy();
    expect(Message.hasSender(input.query)).toBeTruthy();
  });

  it('getSenderType determines the type of sender', function () {
    expect(Message.getSenderType(server)).toEqual('server');
    expect(Message.getSenderType(nick)).toEqual('nick');
    expect(Message.getSenderType(hostmask)).toEqual('hostmask');
  });
});

describe('Message', function () {
  it('common properties', function () {
    var message = new Message(input.generic, receiver);

    expect(message.name).toBe('generic');
    expect(message.args).toEqual(['argument-one', 'argument-two', 'rest arguments']);
    expect(message.receiver).toBe(receiver);
    expect(message.sender).toBe(server);
  });

  it('can lack a sender', function () {
    var message = new Message(input.nosender, receiver);

    expect(message.sender).not.toBeDefined();
  });

  describe("of type:", function () {
    describe("privmsg:", function () {
      it("from a user in a channel", function () {
        var message = new Message(input.chanmsg, receiver);

        expect(message.name).toEqual("privmsg");
        expect(message.isQuery).not.toBeTruthy();
        expect(message.actor).toEqual(message.sender.nick);
        expect(message.channel).toEqual('#channel');
        expect(message.message).toEqual('somebody said something');
      });

      it("from a query", function () {
        var message = new Message(input.query, receiver);

        expect(message.name).toEqual("privmsg");
        expect(message.isQuery).toBeTruthy();
        expect(message.channel).toEqual(message.actor);
        expect(message.channel).toEqual(message.sender.nick);
        expect(message.message).toEqual("hi hi");
      });
    });
  });
});