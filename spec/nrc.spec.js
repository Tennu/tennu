/**
 * @author havvy
 * Waits Total: 1.1 seconds. :(
 */

var NRC = require('../lib/nrc');
var MockSocket = require('./mocksocket');
var util = require('util');

var network = Object.freeze({
  nick : 'testbot',
  user : 'testuser',
  server : 'irc.test.net'
});

autonetwork = {
  nickserv : "nickserv",
  password : "testpass",
  channels : ["#test"]
};
autonetwork.prototype = network;


var mocksocket;
var nrc;

describe('basics', function () {
  beforeEach(function () {
    mocksocket = new MockSocket();
    nrc = new NRC(network, {socket : mocksocket});
  });

  it('wraps an IRC socket', function () {
    nrc.connect();
    nrc.disconnect();
  });

  it('says when it is ready', function () {
    var handler;
    runs(function () {
      handler = {handler : function () {}};
      spyOn(handler, 'handler');
      nrc.on('ready', handler.handler);
      nrc.connect();
    });

    waits(500);

    runs(function () {
      nrc.disconnect();
      expect(handler.handler).toHaveBeenCalled();
    });
  });
});

describe('the nrc api', function () {
  mocksocket = new MockSocket();
  nrc = new NRC(network, {socket : mocksocket});
  nrc.connect();

  beforeEach(function () {
    spyOn(mocksocket, "write").andCallFake(function (message) {
      switch (message) {
        case "JOIN #test\n":
          this.emit('data', ":testbot!testuser@localhost JOIN :#test\r\n:irc.localhost.net 353 testbot = #test :@testbot\r\n:irc.localhost.net 366 testbot #test :End of /NAMES list.");
          break;
        case "QUIT\n":
          this.emit('data', "ERROR :Closing Link: testbot[localhost] (Quit: testbot)\r\n");
          break;
        case "NICK newNick\n":
          this.emit('data', ":testbot!testuser@localhost NICK :newNick\r\n");
          break;
        default:
          void 0;
      }
    });
  });

  waits(500);

  it('can join channels', function () {
    nrc.join("#test");
    expect(mocksocket.write).toHaveBeenCalledWith("JOIN #test\n", 'ascii');
  });

  it('can send messages to channels', function () {
    nrc.say("#test", "It's over 9000!");
    expect(mocksocket.write).toHaveBeenCalledWith("PRIVMSG #test :It's over 9000!\n", 'ascii');
  });

  it('can part channels with a reason', function () {
    nrc.part("#test", "Told to leave.");
    expect(mocksocket.write).toHaveBeenCalledWith("PART #test :Told to leave.\n", 'ascii');
  });

  it('can part channels without a reason', function () {
    nrc.once('join', function onJoin (msg) {
      nrc.part(msg.channel);
    });
    nrc.join("#test");

    waits(100);

    expect(mocksocket.write).toHaveBeenCalledWith("PART #test\n", 'ascii');
  });

  it('can quit', function () {
    nrc.quit();

    expect(mocksocket.write).toHaveBeenCalledWith("QUIT\n", 'ascii');
  });
});

describe('state-tracking', function () {
  it('knows when its nick changes', function () {
    nrc.connect();

    expect(nrc.nick()).toBe('testbot');

    runs(function () {
      nrc.nick('newNick');
    });

    waits(100);

    runs(function () {
      expect(nrc.nick()).toBe('newNick');
    });
  });
});

describe("listening to user commands", function () {
  beforeEach(function () {
    mocksocket = new MockSocket();
    nrc = new NRC(network, {socket : mocksocket}).connect().join("#test");
  });

  it('emits user commands', function () {
    var on = {testcommand : function (event) {} };
    spyOn(on, 'testcommand');

    nrc.on("!testcommand", on.testcommand);

    mocksocket.sendMessage(":sender!user@localhost PRIVMSG #test :!testcommand");
    expect(on.testcommand.callCount).toBe(1);

    mocksocket.sendMessage(":sender!user@localhost PRIVMSG #test :!testcommand");
    expect(on.testcommand.callCount).toBe(2);

    mocksocket.sendMessage(":sender!user@localhost PRIVMSG #test :testbot: testcommand");
    expect(on.testcommand.callCount).toBe(3);

    mocksocket.sendMessage(":sender!user@localhost PRIVMSG testbot :testcommand");
    expect(on.testcommand.callCount).toBe(4);

    mocksocket.sendMessage(":sender!user@localhost PRIVMSG testbot :!testcommand");
    expect(on.testcommand.callCount).toBe(5);
  });
});

describe("autojoin and autoidentify", function () {
  beforeEach(function () {
    mocksocket = new MockSocket();
    nrc = new NRC(autonetwork, {socket : mocksocket});

    spyOn(mocksocket, "write").andCallFake(function (message) {
      switch (message) {
        case "JOIN #test\n":
          this.emit('data', [":testbot!testuser@localhost JOIN :#test",
            ":irc.localhost.net 353 testbot = #test :@testbot",
            ":irc.localhost.net 366 testbot #test :End of /NAMES list."].join("\r\n"));
          break;
        case "PRIVMSG nickserv :identify testpass\n":
          this.emit('data', ":nickserv!services@test.net NOTICE :heartless Password accepted - you are now recognized.");
          break;
        default:
          void 0;
      }
    });
  });

  it('automatically joins specified channels.', function () {
    waits(100);

    runs(function () {
      expect(mocksocket.write).toHaveBeenCalledWith("JOIN #test\n", 'ascii');
    });
  });

  it('automatically identifies to services.', function () {
    waits(100);

    runs(function () {
      expect(mocksocket.write).toHaveBeenCalledWith("PRIVMSG nickserv :identify testpass\n", 'ascii');
    });
  });
});