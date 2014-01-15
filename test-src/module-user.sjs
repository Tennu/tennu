var sinon = require('sinon');
var assert = require('better-assert');
var equal = require('deep-eql');
var inspect = require('util').inspect;
var format = require('util').format;

const debug = false;
const logfn = debug ? console.log.bind(console) : function () {};

var UserModule = require('../tennu_modules/user.js');

describe 'User Module:' {
    var instance, client;

    beforeEach {
        client = {
            debug: logfn,
            error: logfn
        };

        instance = UserModule.init(client, {});
    }

    describe 'Utility Methods:' {
        beforeEach {
            logfn(/* newline */);
        }

        describe 'isIdentifiedAs' {
            var isIdentifiedAs, clock;
            var off_spy, handlers;

            beforeEach {
                isIdentifiedAs = instance.exports.isIdentifiedAs;
                clock = sinon.useFakeTimers();

                client.off = off_spy = sinon.spy();

                var onRegNick, onLoggedIn, onWhoisEnd, onError;
                client.on = function (_handlers) {
                    handlers = _handlers;

                    onRegNick = handlers['RPL_WHOISREGNICK'];
                    onLoggedIn = handlers['RPL_WHOISLOGGEDIN'];
                    onWhoisEnd = handlers['RPL_ENDOFWHOIS'];
                    onError = handlers['ERR_NOSUCHNICK'];
                    off_spy.withArgs(handlers);
                };

                client.whois = function (nickname) {
                    var message = {nickname: nickname};

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
                }
            }

            afterEach {
                clock.restore();
            }

            it 'exists' {
                assert(typeof instance.exports.isIdentifiedAs === 'function');
            }

            it 'returns false for nonexistent nicks' (done) {
                instance.exports.isIdentifiedAs('nonexistent', 'identified')
                .then(function fulfilled (isIdentifiedAs) {
                    assert(isIdentifiedAs === false);
                    assert(off_spy.withArgs(handlers).calledOnce);
                })
                .then(done)
                .done();
            }

            it 'returns false for unidentified nicks' (done) {
                isIdentifiedAs('unidentified', 'identified')
                .then(function fulfilled (isIdentifiedAs) {
                    assert(isIdentifiedAs === false);
                    assert(off_spy.withArgs(handlers).calledOnce);
                })
                .then(done)
                .done();
            }

            it 'returns false for identified nicks to a different nickname (307).' (done) {
                isIdentifiedAs('identified-else-307', 'identified')
                .then(function fulfilled (isIdentifiedAs) {
                    assert(isIdentifiedAs === false);
                    assert(off_spy.withArgs(handlers).calledOnce);
                })
                .then(done)
                .done();
            }

            it 'returns false for identified nicks to a different nickname (330).' (done) {
                isIdentifiedAs('identified-else-330', 'identified')
                .then(function fulfilled (isIdentifiedAs) {
                    assert(isIdentifiedAs === false);
                    assert(off_spy.withArgs(handlers).calledOnce);
                })
                .then(done)
                .done();
            }

            it 'returns true for identified nicks-307' (done) {
                isIdentifiedAs('identified-307', 'identified-307')
                .then(function fulfilled (isIdentifiedAs) {
                    logfn(isIdentifiedAs);
                    assert(isIdentifiedAs === true);
                    assert(off_spy.withArgs(handlers).calledOnce);
                })
                .then(done)
                .done();
            }

            it 'returns true for identified nicks-330' (done) {
                isIdentifiedAs('identified-330', 'identified-330')
                .then(function fulfilled (isIdentifiedAs) {
                    assert(isIdentifiedAs === true);
                    assert(off_spy.withArgs(handlers).calledOnce);
                })
                .then(done)
                .done();
            }

            it 'returns true for identified nicks identified to requested nickname.' (done) {
                isIdentifiedAs('identified-alt', 'identified')
                .then(function fulfilled (isIdentifiedAs) {
                    assert(isIdentifiedAs === true);
                    assert(off_spy.withArgs(handlers).calledOnce);
                })
                .then(done)
                .done();
            }

            it 'times out after an hour' (done) {
                isIdentifiedAs('timeout', 'identified')
                .then(function fulfilled (isIdentifiedAs) {
                    assert(!'called');
                }, function onTimeout (reason) {
                    assert(reason instanceof Error);
                    assert(reason.message === 'Request timed out.');
                    assert(off_spy.withArgs(handlers).calledOnce);
                })
                .then(done)
                .done();
            }
        }
    }
}