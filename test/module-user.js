var sinon$374 = require('sinon');
var assert$375 = require('better-assert');
var equal$376 = require('deep-eql');
var inspect$377 = require('util').inspect;
var format$378 = require('util').format;
const debug$379 = false;
const logfn$380 = debug$379 ? console.log.bind(console) : function () {
    };
var UserModule$381 = require('../tennu_modules/user.js');
describe('User Module:', function () {
    var instance$383, client$384;
    beforeEach(function () {
        client$384 = {
            debug: logfn$380,
            error: logfn$380
        };
        instance$383 = UserModule$381.init(client$384, {});
    });
    describe('Utility Methods:', function () {
        beforeEach(function () {
            logfn$380();
        });
        describe('isIdentifiedAs', function () {
            var isIdentifiedAs$389, clock$390;
            var off_spy$391, handlers$392;
            beforeEach(function () {
                isIdentifiedAs$389 = instance$383.exports.isIdentifiedAs;
                clock$390 = sinon$374.useFakeTimers();
                client$384.off = off_spy$391 = sinon$374.spy();
                var onRegNick$404, onLoggedIn$405, onWhoisEnd$406, onError$407;
                client$384.on = function (_handlers$408) {
                    handlers$392 = _handlers$408;
                    onRegNick$404 = handlers$392['RPL_WHOISREGNICK'];
                    onLoggedIn$405 = handlers$392['RPL_WHOISLOGGEDIN'];
                    onWhoisEnd$406 = handlers$392['RPL_ENDOFWHOIS'];
                    onError$407 = handlers$392['ERR_NOSUCHNICK'];
                    off_spy$391.withArgs(handlers$392);
                };
                client$384.whois = function (nickname$409) {
                    var message$410 = { nickname: nickname$409 };
                    switch (nickname$409) {
                    case 'nonexistent':
                        onError$407(message$410);
                        break;
                    case 'unidentified':
                        onWhoisEnd$406(message$410);
                        break;
                    case 'identified-307':
                    case 'identified-else-307':
                        onRegNick$404(message$410);
                        onWhoisEnd$406(message$410);
                        break;
                    case 'identified-330':
                    case 'identified-else-330':
                        message$410.identifiedas = message$410.nickname;
                        onLoggedIn$405(message$410);
                        onWhoisEnd$406(message$410);
                        break;
                    case 'identified-alt':
                        message$410.identifiedas = 'identified';
                        onLoggedIn$405(message$410);
                        onWhoisEnd$406(message$410);
                        break;
                    case 'timeout':
                        break;
                    default:
                        throw new Error('whois method called with unknown argument: ' + nickname$409);
                    }
                    clock$390.tick(60 * 60 * 1000 + 1);
                };
            });
            afterEach(function () {
                clock$390.restore();
            });
            it('exists', function () {
                assert$375(typeof instance$383.exports.isIdentifiedAs === 'function');
            });
            it('returns false for nonexistent nicks', function (done$411) {
                instance$383.exports.isIdentifiedAs('nonexistent', 'identified').then(function fulfilled(isIdentifiedAs$389) {
                    assert$375(isIdentifiedAs$389 === false);
                    assert$375(off_spy$391.withArgs(handlers$392).calledOnce);
                }).then(done$411).done();
            });
            it('returns false for unidentified nicks', function (done$413) {
                isIdentifiedAs$389('unidentified', 'identified').then(function fulfilled(isIdentifiedAs$389) {
                    assert$375(isIdentifiedAs$389 === false);
                    assert$375(off_spy$391.withArgs(handlers$392).calledOnce);
                }).then(done$413).done();
            });
            it('returns false for identified nicks to a different nickname (307).', function (done$415) {
                isIdentifiedAs$389('identified-else-307', 'identified').then(function fulfilled(isIdentifiedAs$389) {
                    assert$375(isIdentifiedAs$389 === false);
                    assert$375(off_spy$391.withArgs(handlers$392).calledOnce);
                }).then(done$415).done();
            });
            it('returns false for identified nicks to a different nickname (330).', function (done$417) {
                isIdentifiedAs$389('identified-else-330', 'identified').then(function fulfilled(isIdentifiedAs$389) {
                    assert$375(isIdentifiedAs$389 === false);
                    assert$375(off_spy$391.withArgs(handlers$392).calledOnce);
                }).then(done$417).done();
            });
            it('returns true for identified nicks-307', function (done$419) {
                isIdentifiedAs$389('identified-307', 'identified-307').then(function fulfilled(isIdentifiedAs$389) {
                    logfn$380(isIdentifiedAs$389);
                    assert$375(isIdentifiedAs$389 === true);
                    assert$375(off_spy$391.withArgs(handlers$392).calledOnce);
                }).then(done$419).done();
            });
            it('returns true for identified nicks-330', function (done$421) {
                isIdentifiedAs$389('identified-330', 'identified-330').then(function fulfilled(isIdentifiedAs$389) {
                    assert$375(isIdentifiedAs$389 === true);
                    assert$375(off_spy$391.withArgs(handlers$392).calledOnce);
                }).then(done$421).done();
            });
            it('returns true for identified nicks identified to requested nickname.', function (done$423) {
                isIdentifiedAs$389('identified-alt', 'identified').then(function fulfilled(isIdentifiedAs$389) {
                    assert$375(isIdentifiedAs$389 === true);
                    assert$375(off_spy$391.withArgs(handlers$392).calledOnce);
                }).then(done$423).done();
            });
            it('times out after an hour', function (done$425) {
                isIdentifiedAs$389('timeout', 'identified').then(function fulfilled(isIdentifiedAs$389) {
                    assert$375(!'called');
                }, function onTimeout(reason$427) {
                    assert$375(reason$427 instanceof Error);
                    assert$375(reason$427.message === 'Request timed out.');
                    assert$375(off_spy$391.withArgs(handlers$392).calledOnce);
                }).then(done$425).done();
            });
        });
    });
});