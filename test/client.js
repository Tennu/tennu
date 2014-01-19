const sinon = require('sinon');
const assert = require('better-assert');
const equal = require('deep-eql');
const inspect = require('util').inspect;
const format = require('util').format;
const debug = false;
const logfn = debug ? console.log.bind(console) : function () {
    };
const logger = {
        debug: logfn,
        info: logfn,
        notice: logfn,
        warn: logfn,
        error: logfn
    };
const Client = require('../lib/client.js');
const NetSocket = require('../test-lib/mock-net-socket.js');
const network = {
        'nickname': 'testbot',
        'username': 'testuser',
        'server': 'irc.test.net',
        'nickserv': 'nickserv',
        'auth-password': 'testpass',
        'channels': ['#test']
    };
const fakeWrite = function fakeWrite$2(message) {
    fakeWrite$2.spy.apply(this, arguments);
    message = message.substring(0, message.length - 2);
    // console.log('Fakewrite called with message `' + message + '`');
    try {
        if (!this.connected)
            return;
        switch (message) {
        case 'JOIN :#test':
            this.emit('data', [
                ':testbot!testuser@localhost JOIN :#test',
                ':irc.localhost.net 353 testbot = #test :@testbot',
                ':irc.localhost.net 366 testbot #test :End of /NAMES list.\r\n'
            ].join('\r\n'));
            break;
        case 'QUIT':
            this.emit('data', 'ERROR :Closing Link: testbot[localhost] (Quit: testbot)\r\n');
            break;
        case 'NICK newNick':
            this.emit('data', ':testbot!testuser@localhost NICK :newNick\r\n');
            break;
        case 'PART #test':
            this.emit('data', ':testbot!testuser@localhost PART #test\r\n');
            break;
        case 'PRIVMSG nickserv :identify testpass':
            this.emit('data', ':nickserv!services@test.net NOTICE testbot :Password accepted - you are now recognized.\r\n');
            break;
        default:
            void 0;
        }
    } catch (e) {
        console.log('ERROR');
        console.log(e.stack);
    }
};
const boxfn = function (value) {
    return function () {
        return value;
    };
};
describe('Tennu Client', function () {
    var netsocket, tennu;
    beforeEach(function () {
        logfn();
        fakeWrite.spy = sinon.spy();
        netsocket = new NetSocket(logger);
        netsocket.write = fakeWrite;
        tennu = Client(network, {
            NetSocket: boxfn(netsocket),
            Logger: boxfn(logger)
        });
    });
    afterEach(function () {
        logfn('End of test.');
    });
    it('Basic Connecting and Disconnecting', function () {
        assert(tennu.connected === false);
        tennu.connect();
        assert(tennu.connected === true);
        tennu.disconnect();
        assert(tennu.connected === false);
    });
    // Move this to its own file.
    describe('Nickname Tracking', function () {
        beforeEach(function (done) {
            netsocket.on('connect', done);
            tennu.connect();
        });
        afterEach(function (done) {
            netsocket.on('close', done);
            tennu.disconnect();
        });
        it('tracks its initial nickname', function () {
            assert(tennu.nickname() === 'testbot');
        });
        describe('changing nick', function () {
            beforeEach(function (done) {
                tennu.on('nick', function () {
                    done();
                });
                tennu.nick('newNick');
            });
            it('tracks its changed nick', function () {
                assert(tennu.nickname() === 'newNick');
            });
        });
    });
    describe('autojoin', function () {
        beforeEach(function (done) {
            tennu.on('join', function () {
                done();
            });
            tennu.connect();
        });
        afterEach(function (done) {
            netsocket.on('close', done);
            tennu.disconnect();
        });
        it('automatically joins specified channels.', function () {
            assert(fakeWrite.spy.calledWith('JOIN :#test\r\n', 'utf-8'));
        });
    });
    describe('autoidentify', function () {
        beforeEach(function (done) {
            tennu.on('notice', function (e) {
                if (e.nickname === 'nickserv') {
                    done();
                }
            });
            tennu.connect();
        });
        afterEach(function (done) {
            netsocket.on('close', done);
            tennu.disconnect();
        });
        it('automatically identifies to services.', function () {
            assert(fakeWrite.spy.calledWith('PRIVMSG nickserv :identify testpass\r\n', 'utf-8'));
        });
    });
});