var sinon$737 = require('sinon');
var assert$738 = require('better-assert');
var equal$739 = require('deep-eql');
var inspect$740 = require('util').inspect;
var format$741 = require('util').format;
const debug$742 = false;
const logfn$743 = debug$742 ? console.log.bind(console) : function () {
    };
var UserModule$744 = require('../tennu_modules/user.js');
describe('User Module:', function () {
    var instance$746, client$747;
    beforeEach(function () {
        client$747 = {
            debug: logfn$743,
            error: logfn$743
        };
        instance$746 = UserModule$744.init(client$747, {});
    });
    describe('Utility Methods:', function () {
        beforeEach(function () {
            logfn$743();
        });
        describe('isIdentifiedAs', function () {
            var isIdentifiedAs$752, clock$753;
            var off_spy$754, handlers$755;
            beforeEach(function () {
                isIdentifiedAs$752 = instance$746.exports.isIdentifiedAs;
                clock$753 = sinon$737.useFakeTimers();
                client$747.off = off_spy$754 = sinon$737.spy();
                var onRegNick$767, onLoggedIn$768, onWhoisEnd$769, onError$770;
                client$747.on = function (_handlers$771) {
                    handlers$755 = _handlers$771;
                    onRegNick$767 = handlers$755['RPL_WHOISREGNICK'];
                    onLoggedIn$768 = handlers$755['RPL_WHOISLOGGEDIN'];
                    onWhoisEnd$769 = handlers$755['RPL_ENDOFWHOIS'];
                    onError$770 = handlers$755['ERR_NOSUCHNICK'];
                    off_spy$754.withArgs(handlers$755);
                };
                client$747.whois = function (nickname$772) {
                    var message$773 = { nickname: nickname$772 };
                    switch (nickname$772) {
                    case 'nonexistent':
                        onError$770(message$773);
                        break;
                    case 'unidentified':
                        onWhoisEnd$769(message$773);
                        break;
                    case 'identified-307':
                    case 'identified-else-307':
                        onRegNick$767(message$773);
                        onWhoisEnd$769(message$773);
                        break;
                    case 'identified-330':
                    case 'identified-else-330':
                        message$773.identifiedas = message$773.nickname;
                        onLoggedIn$768(message$773);
                        onWhoisEnd$769(message$773);
                        break;
                    case 'identified-alt':
                        message$773.identifiedas = 'identified';
                        onLoggedIn$768(message$773);
                        onWhoisEnd$769(message$773);
                        break;
                    case 'timeout':
                        break;
                    default:
                        throw new Error('whois method called with unknown argument: ' + nickname$772);
                    }
                    clock$753.tick(60 * 60 * 1000 + 1);
                };
            });
            afterEach(function () {
                clock$753.restore();
            });
            it('exists', function () {
                assert$738(typeof instance$746.exports.isIdentifiedAs === 'function');
            });
            it('returns false for nonexistent nicks', function (done$774) {
                instance$746.exports.isIdentifiedAs('nonexistent', 'identified').then(function fulfilled(isIdentifiedAs$752) {
                    assert$738(isIdentifiedAs$752 === false);
                    assert$738(off_spy$754.withArgs(handlers$755).calledOnce);
                }).then(done$774).done();
            });
            it('returns false for unidentified nicks', function (done$776) {
                isIdentifiedAs$752('unidentified', 'identified').then(function fulfilled(isIdentifiedAs$752) {
                    assert$738(isIdentifiedAs$752 === false);
                    assert$738(off_spy$754.withArgs(handlers$755).calledOnce);
                }).then(done$776).done();
            });
            it('returns false for identified nicks to a different nickname (307).', function (done$778) {
                isIdentifiedAs$752('identified-else-307', 'identified').then(function fulfilled(isIdentifiedAs$752) {
                    assert$738(isIdentifiedAs$752 === false);
                    assert$738(off_spy$754.withArgs(handlers$755).calledOnce);
                }).then(done$778).done();
            });
            it('returns false for identified nicks to a different nickname (330).', function (done$780) {
                isIdentifiedAs$752('identified-else-330', 'identified').then(function fulfilled(isIdentifiedAs$752) {
                    assert$738(isIdentifiedAs$752 === false);
                    assert$738(off_spy$754.withArgs(handlers$755).calledOnce);
                }).then(done$780).done();
            });
            it('returns true for identified nicks-307', function (done$782) {
                isIdentifiedAs$752('identified-307', 'identified-307').then(function fulfilled(isIdentifiedAs$752) {
                    logfn$743(isIdentifiedAs$752);
                    assert$738(isIdentifiedAs$752 === true);
                    assert$738(off_spy$754.withArgs(handlers$755).calledOnce);
                }).then(done$782).done();
            });
            it('returns true for identified nicks-330', function (done$784) {
                isIdentifiedAs$752('identified-330', 'identified-330').then(function fulfilled(isIdentifiedAs$752) {
                    assert$738(isIdentifiedAs$752 === true);
                    assert$738(off_spy$754.withArgs(handlers$755).calledOnce);
                }).then(done$784).done();
            });
            it('returns true for identified nicks identified to requested nickname.', function (done$786) {
                isIdentifiedAs$752('identified-alt', 'identified').then(function fulfilled(isIdentifiedAs$752) {
                    assert$738(isIdentifiedAs$752 === true);
                    assert$738(off_spy$754.withArgs(handlers$755).calledOnce);
                }).then(done$786).done();
            });
            it('times out after an hour', function (done$788) {
                isIdentifiedAs$752('timeout', 'identified').then(function fulfilled(isIdentifiedAs$752) {
                    assert$738(!'called');
                }, function onTimeout(reason$790) {
                    assert$738(reason$790 instanceof Error);
                    assert$738(reason$790.message === 'Request timed out.');
                    assert$738(off_spy$754.withArgs(handlers$755).calledOnce);
                }).then(done$788).done();
            });
        });
    });
});