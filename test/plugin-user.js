const sinon = require('sinon');
const assert = require('better-assert');
const equal = require('deep-eql');
const inspect = require('util').inspect;
const format = require('util').format;
const debug = false;
const logfn = debug ? console.log.bind(console) : function () {
    };
const UserModule = require('../tennu_plugins/user.js');
describe('User Module:', function () {
    var instance, client;
    beforeEach(function () {
        client = {
            debug: logfn,
            error: logfn
        };
        instance = UserModule.init(client, {});
    });
    describe('Utility Methods:', function () {
        beforeEach(function () {
            logfn();
        });
        describe('isIdentifiedAs', function () {
            var isIdentifiedAs, clock;
            var off_spy, handlers;
            beforeEach(function () {
                isIdentifiedAs = instance.exports.isIdentifiedAs;
                clock = sinon.useFakeTimers();
                client.off = off_spy = sinon.spy();
                var onRegNick, onLoggedIn, onWhoisEnd, onError;
                client.on = function (_handlers) {
                    handlers = _handlers;
                    onRegNick = handlers['rpl_whoisregnick'];
                    onLoggedIn = handlers['rpl_whoisloggedin'];
                    onWhoisEnd = handlers['rpl_endofwhois'];
                    onError = handlers['err_nosuchnick'];
                    off_spy.withArgs(handlers);
                };
                client.whois = function (nickname) {
                    var message = { nickname: nickname };
                    switch (nickname) {
                    case 'nonexistent':
                        onError(message);
                        break;
                    case 'unidentified':
                        onWhoisEnd(message);
                        break;
                    case 'identified-307':
                    case 'identified-else-307':
                        onRegNick(message);
                        onWhoisEnd(message);
                        break;
                    case 'identified-330':
                    case 'identified-else-330':
                        message.identifiedas = message.nickname;
                        onLoggedIn(message);
                        onWhoisEnd(message);
                        break;
                    case 'identified-alt':
                        message.identifiedas = 'identified';
                        onLoggedIn(message);
                        onWhoisEnd(message);
                        break;
                    case 'timeout':
                        break;
                    default:
                        throw new Error('whois method called with unknown argument: ' + nickname);
                    }
                    clock.tick(60 * 60 * 1000 + 1);
                };
            });
            afterEach(function () {
                clock.restore();
            });
            it('exists', function () {
                assert(typeof instance.exports.isIdentifiedAs === 'function');
            });
            it('returns false for nonexistent nicks', function (done) {
                instance.exports.isIdentifiedAs('nonexistent', 'identified').then(function fulfilled(isIdentifiedAs$2) {
                    assert(isIdentifiedAs$2 === false);
                    assert(off_spy.withArgs(handlers).calledOnce);
                }).then(done).done();
            });
            it('returns false for unidentified nicks', function (done) {
                isIdentifiedAs('unidentified', 'identified').then(function fulfilled(isIdentifiedAs$2) {
                    assert(isIdentifiedAs$2 === false);
                    assert(off_spy.withArgs(handlers).calledOnce);
                }).then(done).done();
            });
            it('returns false for identified nicks to a different nickname (307).', function (done) {
                isIdentifiedAs('identified-else-307', 'identified').then(function fulfilled(isIdentifiedAs$2) {
                    assert(isIdentifiedAs$2 === false);
                    assert(off_spy.withArgs(handlers).calledOnce);
                }).then(done).done();
            });
            it('returns false for identified nicks to a different nickname (330).', function (done) {
                isIdentifiedAs('identified-else-330', 'identified').then(function fulfilled(isIdentifiedAs$2) {
                    assert(isIdentifiedAs$2 === false);
                    assert(off_spy.withArgs(handlers).calledOnce);
                }).then(done).done();
            });
            it('returns true for identified nicks-307', function (done) {
                isIdentifiedAs('identified-307', 'identified-307').then(function fulfilled(isIdentifiedAs$2) {
                    logfn(isIdentifiedAs$2);
                    assert(isIdentifiedAs$2 === true);
                    assert(off_spy.withArgs(handlers).calledOnce);
                }).then(done).done();
            });
            it('returns true for identified nicks-330', function (done) {
                isIdentifiedAs('identified-330', 'identified-330').then(function fulfilled(isIdentifiedAs$2) {
                    assert(isIdentifiedAs$2 === true);
                    assert(off_spy.withArgs(handlers).calledOnce);
                }).then(done).done();
            });
            it('returns true for identified nicks identified to requested nickname.', function (done) {
                isIdentifiedAs('identified-alt', 'identified').then(function fulfilled(isIdentifiedAs$2) {
                    assert(isIdentifiedAs$2 === true);
                    assert(off_spy.withArgs(handlers).calledOnce);
                }).then(done).done();
            });
            it('times out after an hour', function (done) {
                isIdentifiedAs('timeout', 'identified').then(function fulfilled(isIdentifiedAs$2) {
                    assert(!'called');
                }, function onTimeout(reason) {
                    assert(reason instanceof Error);
                    assert(reason.message === 'Request timed out.');
                    assert(off_spy.withArgs(handlers).calledOnce);
                }).then(done).done();
            });
        });
    });
});