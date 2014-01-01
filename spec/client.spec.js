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
    message = message.substring(0, message.length - 2);
    // console.log("Fakewrite called with message `" + message + "`");
    try {
        if (!this.connected) return;

        switch (message) {
            case "JOIN :#test":
            this.emit('data', [
                ":testbot!testuser@localhost JOIN :#test",
                ":irc.localhost.net 353 testbot = #test :@testbot",
                ":irc.localhost.net 366 testbot #test :End of /NAMES list.\r\n"].join('\r\n'));
            break;
            case "QUIT":
            this.emit('data', "ERROR :Closing Link: testbot[localhost] (Quit: testbot)\r\n");
            break;
            case "NICK newNick":
            this.emit('data', ":testbot!testuser@localhost NICK :newNick\r\n");
            break;
            case "PART #test":
            this.emit('data', ":testbot!testuser@localhost PART #test\r\n");
            break;
            case "PRIVMSG nickserv :identify testpass":
            this.emit('data', ":nickserv!services@test.net NOTICE testbot :Password accepted - you are now recognized.\r\n");
            break;
            default:
            void 0;
        }
    } catch (e) {
        console.log("ERROR");
        console.log(e.stack);
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
            expect(tennu.nickname()).toBe('testbot');
        });

        describe('changing nick', function () {
            beforeEach(function (done) {
                tennu.on('nick', function () {
                    done();
                });

                tennu.nick('newNick');
            });

            it('tracks its changed nick', function () {
                expect(tennu.nickname()).toBe('newNick');
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

        it('automatically joins specified channels.', function () {
            expect(netsocket.write).toHaveBeenCalledWith("JOIN :#test\r\n", 'utf-8');
        });
    });

    describe("autoidentify", function () {
        beforeEach(function (done) {
            tennu.on("notice", function(e) {
                if (e.nickname === "nickserv") {
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
            expect(netsocket.write).toHaveBeenCalledWith("PRIVMSG nickserv :identify testpass\r\n", 'utf-8');
        });
    });
});