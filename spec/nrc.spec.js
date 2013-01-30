/**
 * @author havvy
 * Waits Total: 1.1 seconds. :(
 */

var util = require('util');

var NRC = require('../lib/nrc');
var MockSocket = require('./mocksocket');

var network = Object.freeze({
  nick : 'testbot',
  user : 'testuser',
  server : 'irc.test.net'
});

var autonetwork = {
  nickserv : "nickserv",
  password : "testpass",
  channels : ["#test"],
  prototype: network
};

var fakeWrite = function (message) {
  switch (message) {
    case "JOIN #test\n":
      this.emit('data', [
        ":testbot!testuser@localhost JOIN :#test",
        ":irc.localhost.net 353 testbot = #test :@testbot",
        ":irc.localhost.net 366 testbot #test :End of /NAMES list.\r\n"].join('\r\n'));
      break;
    case "QUIT\n":
      this.emit('data', "ERROR :Closing Link: testbot[localhost] (Quit: testbot)\r\n");
      break;
    case "NICK newNick\n":
      this.emit('data', ":testbot!testuser@localhost NICK :newNick\r\n");
      break;
    case "PART #test\n":
      this.emit('data', ":testbot!testuser@localhost PART #test\r\n");
      break;
    case "PRIVMSG nickserv :identify testpass\n":
      this.emit('data', ":nickserv!services@test.net NOTICE :testbot Password accepted - you are now recognized.\rn\n");
      break;
    default:
      void 0;
  }
};

describe('basics', function () {
  var mocksocket, nrc;

  beforeEach(function () {
    mocksocket = new MockSocket();
    nrc = new NRC(network, {socket : mocksocket});
  });

  afterEach(function () {
    nrc.disconnect();
  });

  it('wraps an IRC socket', function () {
    nrc.connect();
  });

  it('says when it is ready', function () {
    var handler = jasmine.createSpy("handler");

    runs(function () {
      nrc.on('ready', handler);
      nrc.connect();
    });

    waitsFor(function () {
      return handler.wasCalled;
    }, "handler was called", 500);

    runs(function () {
      expect(handler).toHaveBeenCalled();
    });
  });
});


describe('the nrc api', function () {
  var mocksocket, nrc;

  beforeEach(function () {
    var ready = false;

    mocksocket = new MockSocket();
    mocksocket.write.andCallFake(fakeWrite);

    nrc = new NRC(network, {socket : mocksocket});

    nrc.on("ready", function () {
      ready = true;
    });

    nrc.connect();

    waitsFor(function () {
      return ready;
    }, "nrc is ready", 100);
  });

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
    var done = false;

    runs(function () {
      nrc.once('join', function onJoin (msg) {
        this.part(msg.channel);
      });

      nrc.once('part', function (msg) {
        done = true;
      });

      nrc.join("#test");
    });

    waitsFor(function () { return done; }, "nrc parted", 1000);

    runs(function () {
      expect(mocksocket.write).toHaveBeenCalledWith("PART #test\n", 'ascii');
    });
  });

  it('can quit', function () {
    nrc.quit();

    expect(mocksocket.write).toHaveBeenCalledWith("QUIT\n", 'ascii');
  });
});

describe('state-tracking', function () {
  var nrc = new NRC(network, {socket: new MockSocket()});

  it('knows when its nick changes', function () {
    runs(function () {
      nrc.connect();

      expect(nrc.nick()).toBe('testbot');

      nrc.nick('newNick');
    });

    waitsFor(function() {
      return nrc.nick() !== 'testbot';
    }, "nick changed", 100);

    runs(function () {
      expect(nrc.nick()).toBe('newNick');
    });
  });
});

// This is more an integration test...
// Should have this test for the Commander spec too.
describe("listening to user commands", function () {
  var nrc, mocksocket, called;

  beforeEach(function () {
    var done = false;

    mocksocket = new MockSocket();
    mocksocket.write.andCallFake(fakeWrite);
    nrc = new NRC(network, {socket : mocksocket});

    nrc.on("!testcommand", function () {
      called = true;
    });

    nrc.on("join", function () {
      done = true;
    });

    nrc.connect().join("#test");

    waitsFor(function () { return done; }, "#test is joined.", 200);
  });

  afterEach(function () {
    nrc.disconnect();
  });

  it('listens to commands starting with the trigger letter', function () {
    runs(function() {
      mocksocket.emit("data", ":sender!user@localhost PRIVMSG #test :!testcommand\r\n");
    });

    waitsFor(function () { return called; }, "spy was called", 1000);
    //expect(spy).toHaveBeenCalled();
  });

  it('listens to commands directed to it', function () {
    runs(function() {
      mocksocket.emit("data", ":sender!user@localhost PRIVMSG #test :testbot: testcommand\r\n");
    });

    waitsFor(function () { return called; }, "spy was called", 100);
    //expect(spy).toHaveBeenCalled();
  });

  it('listens to commands via private messages', function () {
    runs(function() {
      mocksocket.emit("data", ":sender!user@localhost PRIVMSG testbot :testcommand\r\n");
    });

    waitsFor(function () { return called; }, "spy was called", 100);
    //expect(spy).toHaveBeenCalled();
  });

  it('event ignores the trigger charcter in private messages', function () {
    runs(function() {
      mocksocket.emit("data", ":sender!user@localhost PRIVMSG testbot :!testcommand\r\n");
    });

    waitsFor(function () { return called; }, "spy was called", 100);
    //expect(spy).toHaveBeenCalled();
  });
});

describe("autojoin and autoidentify", function () {
  var mocksocket, nrc, hasJoined, hasIdentified;

  beforeEach(function () {
    hasJoined = false;
    hasIdentified = false;

    mocksocket = new MockSocket();
    mocksocket.write.andCallFake(fakeWrite);
    nrc = new NRC(autonetwork, {socket : mocksocket});

    nrc.on("join", function () {
      hasJoined = true;
    });

    nrc.on("notice", function(e) {
      if (e.actor === "nickserv") {
        hasIdentified = true;
      }
    });

    nrc.connect();
  });

  afterEach(function () {
    nrc.disconnect();
  });

  it('automatically joins specified channels.', function () {
    waitsFor(function () { return hasJoined; }, "has joined", 100);

    runs(function () {
      expect(mocksocket.write).toHaveBeenCalledWith("JOIN #test\n", 'ascii');
    });
  });

  it('automatically identifies to services.', function () {
    waitsFor(function () { return hasIdentified; }, "has identified", 100);

    runs(function () {
      expect(mocksocket.write).toHaveBeenCalledWith("PRIVMSG nickserv :identify testpass\n", 'ascii');
    });
  });
});