const sinon$374 = require('sinon');
const assert$375 = require('better-assert');
const equal$376 = require('deep-eql');
const inspect$377 = require('util').inspect;
const format$378 = require('util').format;
const debug$379 = false;
const logfn$380 = debug$379 ? console.log.bind(console) : function () {
    };
const logger$381 = {
        debug: logfn$380,
        info: logfn$380,
        notice: logfn$380,
        warn: logfn$380,
        error: logfn$380
    };
const Client$382 = require('../lib/client.js');
const NetSocket$383 = require('../test-lib/mock-net-socket.js');
const network$384 = {
        nick: 'testbot',
        user: 'testuser',
        server: 'irc.test.net',
        nickserv: 'nickserv',
        password: 'testpass',
        channels: ['#test']
    };
const fakeWrite$385 = function fakeWrite$385(message) {
    fakeWrite$385.spy.apply(this, arguments);
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
const boxfn$386 = function (value) {
    return function () {
        return value;
    };
};
describe('Tennu Client', function () {
    var netsocket$388, tennu$389;
    beforeEach(function () {
        logfn$380();
        fakeWrite$385.spy = sinon$374.spy();
        netsocket$388 = new NetSocket$383(logger$381);
        netsocket$388.write = fakeWrite$385;
        tennu$389 = Client$382(network$384, {
            NetSocket: boxfn$386(netsocket$388),
            Logger: boxfn$386(logger$381)
        });
    });
    afterEach(function () {
        logfn$380('End of test.');
    });
    it('Basic Connecting and Disconnecting', function () {
        assert$375(tennu$389.connected === false);
        tennu$389.connect();
        assert$375(tennu$389.connected === true);
        tennu$389.disconnect();
        assert$375(tennu$389.connected === false);
    });
    // Move this to its own file.
    describe('Nickname Tracking', function () {
        beforeEach(function (done$400) {
            netsocket$388.on('connect', done$400);
            tennu$389.connect();
        });
        afterEach(function (done$401) {
            netsocket$388.on('close', done$401);
            tennu$389.disconnect();
        });
        it('tracks its initial nickname', function () {
            assert$375(tennu$389.nickname() === 'testbot');
        });
        describe('changing nick', function () {
            beforeEach(function (done$404) {
                tennu$389.on('nick', function () {
                    done$404();
                });
                tennu$389.nick('newNick');
            });
            it('tracks its changed nick', function () {
                assert$375(tennu$389.nickname() === 'newNick');
            });
        });
    });
    describe('autojoin', function () {
        beforeEach(function (done$408) {
            tennu$389.on('join', function () {
                done$408();
            });
            tennu$389.connect();
        });
        afterEach(function (done$409) {
            netsocket$388.on('close', done$409);
            tennu$389.disconnect();
        });
        it('automatically joins specified channels.', function () {
            assert$375(fakeWrite$385.spy.calledWith('JOIN :#test\r\n', 'utf-8'));
        });
    });
    describe('autoidentify', function () {
        beforeEach(function (done$413) {
            tennu$389.on('notice', function (e$414) {
                if (e$414.nickname === 'nickserv') {
                    done$413();
                }
            });
            tennu$389.connect();
        });
        afterEach(function (done$415) {
            netsocket$388.on('close', done$415);
            tennu$389.disconnect();
        });
        it('automatically identifies to services.', function () {
            assert$375(fakeWrite$385.spy.calledWith('PRIVMSG nickserv :identify testpass\r\n', 'utf-8'));
        });
    });
});