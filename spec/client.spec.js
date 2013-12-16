var util = require('util');

var Client = require('../lib/client.js');
var NetSocket = require('./lib/mock-net-socket.js');

var network = {
    nick: 'testbot',
    user: 'testuser',
    server: 'irc.test.net',
    nickserv : "nickserv",
    password : "testpass",
    channels : ["#test"],
};

var fakeWrite = function (message) {
    //console.log("Fakewrite called with message " + message.substring(0, message.length - 2));
    switch (message) {
        case "JOIN #test\r\n":
        this.emit('data', [
            ":testbot!testuser@localhost JOIN :#test",
            ":irc.localhost.net 353 testbot = #test :@testbot",
            ":irc.localhost.net 366 testbot #test :End of /NAMES list.\r\n"].join('\r\n'));
        break;
        case "QUIT\r\n":
        this.emit('data', "ERROR :Closing Link: testbot[localhost] (Quit: testbot)\r\n");
        break;
        case "NICK newNick\r\n":
        this.emit('data', ":testbot!testuser@localhost NICK :newNick\r\n");
        break;
        case "PART #test\r\n":
        this.emit('data', ":testbot!testuser@localhost PART #test\r\n");
        break;
        case "PRIVMSG nickserv :identify testpass\r\n":
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
    var netsocket, tennu;

    beforeEach(function () {
        netsocket = new NetSocket();
        netsocket.write.andCallFake(fakeWrite);
        tennu = Client(network, {NetSocket: boxfn(netsocket)});
    });

    afterEach(function () {
        netsocket = undefined;
        tennu = undefined;
    });

    it('Basic Connecting and Disconnecting', function () {
        expect(tennu.connected).toBe(false);
        tennu.connect();
        expect(tennu.connected).toBe(true);
        tennu.disconnect();
        expect(tennu.connected).toBe(false);
    });

    describe('Nickname Tracking', function () {
        beforeEach(function (done) {
            netsocket.on('connect', function () {
                done();
            });

            tennu.connect();
        });

        afterEach(function (done) {
            netsocket.on('close', function () {
                done();
            });

            tennu.disconnect();
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
                expect(tennu.nick()).toBe('newNick');
            });
        });
    });

    describe("autojoin", function () {
        beforeEach(function (done) {
            tennu.on("join", function () {
                done();
            });

            tennu.connect();
        });

        afterEach(function (done) {
            netsocket.on('close', function () {
                done();
            });

            tennu.disconnect();
        });

        it('automatically joins specified channels.', function (done) {
            expect(netsocket.write).toHaveBeenCalledWith("JOIN #test\n", 'ascii');
        });
    });

    describe("autoidentify", function () {
        beforeEach(function (done) {
            tennu.on("notice", function(e) {
                if (e.actor === "nickserv") {
                    done();
                }
            });

            tennu.connect();
        });

        afterEach(function (done) {
            netsocket.on('close', function () {
                done();
            });

            tennu.disconnect();
        });

        it('automatically identifies to services.', function () {
            expect(netsocket.write).toHaveBeenCalledWith("PRIVMSG nickserv :identify testpass\n", 'ascii');
        });
    });
});

// This is more an integration test...
// Should have this test for the CommandHander iface spec too.
xdescribe("listening to user commands", function () {
  var client, netsocket, called;

  beforeEach(function () {
    var done = false;

    netsocket = new NetSocket();
    netsocket.write.andCallFake(fakeWrite);
    client = new client(network, {Socket : boxfn(netsocket)});

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
      netsocket.emit("data", ":sender!user@localhost PRIVMSG #test :!testcommand\r\n");
  });

    waitsFor(function () { return called; }, "spy was called", 1000);
    //expect(spy).toHaveBeenCalled();
});

  it('listens to commands directed to it', function () {
    runs(function() {
      netsocket.emit("data", ":sender!user@localhost PRIVMSG #test :testbot: testcommand\r\n");
  });

    waitsFor(function () { return called; }, "spy was called", 100);
    //expect(spy).toHaveBeenCalled();
});

  it('listens to commands via private messages', function () {
    runs(function() {
      netsocket.emit("data", ":sender!user@localhost PRIVMSG testbot :testcommand\r\n");
  });

    waitsFor(function () { return called; }, "spy was called", 100);
    //expect(spy).toHaveBeenCalled();
});

  it('event ignores the trigger charcter in private messages', function () {
    runs(function() {
      netsocket.emit("data", ":sender!user@localhost PRIVMSG testbot :!testcommand\r\n");
  });

    waitsFor(function () { return called; }, "spy was called", 100);
    //expect(spy).toHaveBeenCalled();
});
});