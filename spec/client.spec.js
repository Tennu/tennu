var util = require('util');

var tennu = require('../lib/tennu');
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

var closure = function (value) {
  return function () { return value; };
};

describe('tennu', function () {
  var mocksocket, tennu;

  beforeEach(function () {
    mocksocket = new MockSocket();
    tennu = new tennu(network, {Socket : closure(mocksocket)});
  });

  afterEach(function () {
    tennu.disconnect();
  });

  it('connects to an IRC socket', function () {
    tennu.connect();
  });
});


describe('the tennu api', function () {
  var mocksocket, tennu;

  beforeEach(function () {
    var ready = false;

    mocksocket = new MockSocket();
    mocksocket.write.andCallFake(fakeWrite);

    tennu = new tennu(network, {Socket : closure(mocksocket)});

    tennu._socket.on("ready", function () {
      ready = true;
    });

    tennu.connect();

    waitsFor(function () {
      return ready;
    }, "tennu is ready", 100);
  });

  it('can join channels', function () {
    tennu.join("#test");
    expect(mocksocket.write).toHaveBeenCalledWith("JOIN #test\n", 'ascii');
  });

  it('can send messages to channels', function () {
    tennu.say("#test", "It's over 9000!");
    expect(mocksocket.write).toHaveBeenCalledWith("PRIVMSG #test :It's over 9000!\n", 'ascii');
  });

  it('can part channels with a reason', function () {
    tennu.part("#test", "Told to leave.");
    expect(mocksocket.write).toHaveBeenCalledWith("PART #test :Told to leave.\n", 'ascii');
  });

  it('can part channels without a reason', function () {
    var done = false;

    runs(function () {
      tennu.once('join', function onJoin (msg) {
        tennu.part(msg.channel);
      });

      tennu.once('part', function onPart (msg) {
        done = true;
      });

      tennu.join("#test");
    });

    waitsFor(function () { return done; }, "tennu parted", 200);

    runs(function () {
      expect(mocksocket.write).toHaveBeenCalledWith("PART #test\n", 'ascii');
    });
  });

  // Failing with no discerable reason.
  it('can quit', function () {
    tennu.quit();

    expect(mocksocket.write).toHaveBeenCalledWith("QUIT\n", 'ascii');
  });
});

describe('state-tracking', function () {
  var tennu = new tennu(network, {Socket: MockSocket});

  it('knows when its nick changes', function () {
    runs(function () {
      tennu.connect();

      expect(tennu.nick()).toBe('testbot');

      tennu.nick('newNick');
    });

    waitsFor(function() {
      return tennu.nick() !== 'testbot';
    }, "nick changed", 100);

    runs(function () {
      expect(tennu.nick()).toBe('newNick');
    });
  });
});

// This is more an integration test...
// Should have this test for the CommandHander iface spec too.
describe("listening to user commands", function () {
  var tennu, mocksocket, called;

  beforeEach(function () {
    var done = false;

    mocksocket = new MockSocket();
    mocksocket.write.andCallFake(fakeWrite);
    tennu = new tennu(network, {Socket : closure(mocksocket)});

    tennu.on("!testcommand", function () {
      called = true;
    });

    tennu.on("join", function () {
      done = true;
    });

    tennu.connect().join("#test");

    waitsFor(function () { return done; }, "#test is joined.", 200);
  });

  afterEach(function () {
    tennu.disconnect();
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
  var mocksocket, tennu, hasJoined, hasIdentified;

  beforeEach(function () {
    hasJoined = false;
    hasIdentified = false;

    mocksocket = new MockSocket();
    mocksocket.write.andCallFake(fakeWrite);
    tennu = new tennu(autonetwork, {Socket : closure(mocksocket)});

    tennu.on("join", function () {
      hasJoined = true;
    });

    tennu.on("notice", function(e) {
      if (e.actor === "nickserv") {
        hasIdentified = true;
      }
    });

    tennu.connect();
  });

  afterEach(function () {
    tennu.disconnect();
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