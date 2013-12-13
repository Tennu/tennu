var util = require('util');

var Client = require('../lib/client.js');
var MockSocket = require('./mocksocket.js');

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

var boxfn = function (value) {
  return function () { return value; };
};

describe('Tennu Client', function () {
    var mocksocket, tennu;

    beforeEach(function () {
        mocksocket = new MockSocket();
        mocksocket.write.andCallFake(fakeWrite);
        tennu = Client(network, {Socket: boxfn(mocksocket)});
    });

    afterEach(function () {
        mocksocket = undefined;
        tennu = undefined;
    });

    it('Basic Connecting and Disconnecting', function () {
        expect(tennu.connect.bind(tennu)).not.toThrow();
        expect(tennu.disconnect.bind(tennu)).not.toThrow();
    });

    describe('State Tracking', function () {
        beforeEach(function (done) {
            tennu._socket.on('ready', function () {
                done();
            });

            tennu.connect();
        });

        it('tracks its initial nickname', function () {
            expect(tennu.nick()).toBe('testbot');
        });

        describe('changing nick', function () {
            beforeEach(function (done) {
                tennu.on('nick', function () {
                    done();
                });

                tennu.nick('newNick');
            });

            it('tracks its changed nick', function () {
                expect(client.nick()).toBe('newNick');
            });
        });
    });
});

// This is more an integration test...
// Should have this test for the CommandHander iface spec too.
xdescribe("listening to user commands", function () {
  var client, mocksocket, called;

  beforeEach(function () {
    var done = false;

    mocksocket = new MockSocket();
    mocksocket.write.andCallFake(fakeWrite);
    client = new client(network, {Socket : boxfn(mocksocket)});

    client.on("!testcommand", function () {
      called = true;
  });

    client.on("join", function () {
      done = true;
  });

    client.connect().join("#test");

    waitsFor(function () { return done; }, "#test is joined.", 200);
});

  afterEach(function () {
    client.disconnect();
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

xdescribe("autojoin and autoidentify", function () {
  var mocksocket, client, hasJoined, hasIdentified;

  beforeEach(function () {
    hasJoined = false;
    hasIdentified = false;

    mocksocket = new MockSocket();
    mocksocket.write.andCallFake(fakeWrite);
    client = new client(autonetwork, {Socket : boxfn(mocksocket)});

    client.on("join", function () {
      hasJoined = true;
  });

    client.on("notice", function(e) {
      if (e.actor === "nickserv") {
        hasIdentified = true;
    }
});

    client.connect();
});

  afterEach(function () {
    client.disconnect();
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