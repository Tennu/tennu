var Message = require('../lib/message');
var receiver = {_id: require('./lib/id')(), nick: function () { return "tnick"; }};

var hostmask = "sender!malicious@test.suite.net";
var nick = "buddy";
var server = "server.network.net";

var messages = {
  generic: ':' + server + " GENERIC argument-one argument-two :rest arguments",
  chanmsg: [":" + hostmask, "PRIVMSG", "#channel", ":somebody said something"].join(' '),
  nosender: "GENERIC a1 a2 :rest args",
  query: ":" + hostmask + " PRIVMSG " + receiver.nick() + " :hi hi",
  oddspacing: "GENERIC  a1   a2  :rest arguments  ",
  privmsgWithOddSpacing: ":sender!user@localhost PRIVMSG #test :  testbot:   testcommand   "
};

describe('Message', function () {
  it('common properties', function () {
    var message = Message(messages.generic, receiver);

    expect(message.command).toBe('generic');
    expect(message.params).toEqual(['argument-one', 'argument-two', 'rest arguments']);
    expect(message.receiver).toBe(receiver);
    expect(message.prefix).toBe(server);
  });

  it('handles odd spacing', function () {
    var message = Message(messages.oddspacing, receiver);

    expect(message.command).toBe("generic");
    expect(message.params).toEqual(['a1', 'a2', 'rest arguments  ']);
  });

  describe("of type:", function () {
    describe("privmsg:", function () {
      it("channel", function () {
        var message = Message(messages.chanmsg, receiver);

        expect(message.command).toEqual("privmsg");
        expect(message.isQuery).not.toBeTruthy();
        expect(message.nickname).toEqual(message.hostmask.nickname);
        expect(message.channel).toEqual('#channel');
        expect(message.message).toEqual('somebody said something');
      });

      it("query", function () {
        var message = Message(messages.query, receiver);

        expect(message.command).toEqual("privmsg");
        expect(message.isQuery).toBeTruthy();
        expect(message.channel).toEqual("sender");
        expect(message.message).toEqual("hi hi");
      });

      it("odd spacing", function () {
        var message = Message(messages.privmsgWithOddSpacing, receiver);

        expect(message.command).toBe('privmsg');
        expect(message.isQuery).not.toBeTruthy();
        expect(message.nickname).toBe(message.hostmask.nickname);
        expect(message.channel).toBe('#test');
        expect(message.params[0]).toBe('#test');
        expect(message.params[1]).toBe('  testbot:   testcommand   ');
        expect(message.message).toBe("testbot:   testcommand");
      });
    });
  });
});