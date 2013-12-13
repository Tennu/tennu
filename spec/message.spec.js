var Message = require('../lib/message');
var receiver = {_id: require('./id')(), nick: function () { return "tnick"; }};

var hostmask = "sender!malicious@test.suite.net";
var nick = "buddy";
var server = "server.network.net";

var input = {
  generic: ':' + server + " GENERIC argument-one argument-two :rest arguments",
  chanmsg: [":" + hostmask, "PRIVMSG", "#channel", ":somebody said something"].join(' '),
  nosender: "GENERIC a1 a2 :rest args",
  query: ":" + hostmask + " PRIVMSG " + receiver.nick() + " :hi hi",
  oddspacing: "GENERIC  a1   a2  :rest arguments  "
};

describe('Message', function () {
  it('common properties', function () {
    var message = Message(input.generic, receiver);

    expect(message.command).toBe('generic');
    expect(message.params).toEqual(['argument-one', 'argument-two', 'rest arguments']);
    expect(message.receiver).toBe(receiver);
    expect(message.prefix).toBe(server);
  });

  it('handles odd spacing', function () {
    var message = Message(input.oddspacing, receiver);

    expect(message.command).toBe("generic");
    expect(message.params).toEqual(['a1', 'a2', 'rest arguments  ']);
  });

  describe("of type:", function () {
    describe("privmsg:", function () {
      it("from a user in a channel", function () {
        var message = Message(input.chanmsg, receiver);

        expect(message.command).toEqual("privmsg");
        expect(message.isQuery).not.toBeTruthy();
        expect(message.actor).toEqual(message.sender.nickname);
        expect(message.channel).toEqual('#channel');
        expect(message.message).toEqual('somebody said something');
      });

      it("from a query", function () {
        var message = Message(input.query, receiver);

        expect(message.command).toEqual("privmsg");
        expect(message.isQuery).toBeTruthy();
        expect(message.channel).toEqual(message.actor);
        expect(message.channel).toEqual(message.sender.nickname);
        expect(message.message).toEqual("hi hi");
      });
    });
  });
});