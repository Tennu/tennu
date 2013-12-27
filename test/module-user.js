var sinon = require('sinon');
var assert = require('better-assert');
var equal = require('deep-eql');
var inspect = require('util').inspect;
var format = require('util').format;

var user_module = require('../tennu_modules/user.js');

describe("User Module:", function () {
    var user;
    var tennu

    beforeEach(function () {
        tennu = {
            debug: false ? console.log.bind(console) : function () {},
            error: false ? console.log.bind(console) : function () {}
        };
        user = user_module(tennu);
    });

    describe("Utility Methods:", function () {
        describe("isIdentifiedAs", function () {
            var isIdentifiedAs, clock;
            var off_spy, handlers;

            beforeEach(function () {
                isIdentifiedAs = user.exports.isIdentifiedAs;
                clock = sinon.useFakeTimers();

                tennu.off = off_spy = sinon.spy();

                var onRegNick, onLoggedIn, onWhoisEnd, onError;
                tennu.on = function (_handlers) {
                    handlers = _handlers;

                    onRegNick = handlers["RPL_WHOISREGNICK"];
                    onLoggedIn = handlers["RPL_WHOISLOGGEDIN"];
                    onWhoisEnd = handlers["RPL_ENDOFWHOIS"];
                    onError = handlers["ERR_NOSUCHNICK"];
                    off_spy.withArgs(handlers);
                };

                tennu.whois = function (nickname) {
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
                        throw new Error("whois method called with unknown argument: " + nickname);
                    }

                    clock.tick(60 * 60 * 1000 + 1);
                }
            });

            afterEach(function () {
                clock.restore();
            });

            it("exists", function () {
                assert(typeof user.exports.isIdentifiedAs === 'function');
            });

            it("returns false for nonexistent nicks", function (done) {
                user.exports.isIdentifiedAs('nonexistent', 'identified')
                .then(function fulfilled (isIdentifiedAs) {
                    assert(isIdentifiedAs === false);
                    assert(off_spy.withArgs(handlers).calledOnce);
                })
                .then(done)
                .done();
            });

            it("returns false for unidentified nicks", function (done) {
                isIdentifiedAs('unidentified', 'identified')
                .then(function fulfilled (isIdentifiedAs) {
                    assert(isIdentifiedAs === false);
                    assert(off_spy.withArgs(handlers).calledOnce);
                })
                .then(done)
                .done();
            });

            it("returns false for identified nicks to a different nickname (307).", function (done) {
                isIdentifiedAs('identified-else-307', 'identified')
                .then(function fulfilled (isIdentifiedAs) {
                    assert(isIdentifiedAs === false);
                    assert(off_spy.withArgs(handlers).calledOnce);
                })
                .then(done)
                .done();
            });

            it("returns false for identified nicks to a different nickname (330).", function (done) {
                isIdentifiedAs('identified-else-330', 'identified')
                .then(function fulfilled (isIdentifiedAs) {
                    assert(isIdentifiedAs === false);
                    assert(off_spy.withArgs(handlers).calledOnce);
                })
                .then(done)
                .done();
            });

            it("returns true for identified nicks-307", function (done) {
                isIdentifiedAs('identified-307', 'identified-307')
                .then(function fulfilled (isIdentifiedAs) {
                    assert(isIdentifiedAs === true);
                    assert(off_spy.withArgs(handlers).calledOnce);
                })
                .then(done)
                .done();
            });

            it("returns true for identified nicks-330", function (done) {
                isIdentifiedAs('identified-330', 'identified-330')
                .then(function fulfilled (isIdentifiedAs) {
                    assert(isIdentifiedAs === true);
                    assert(off_spy.withArgs(handlers).calledOnce);
                })
                .then(done)
                .done();
            });

            it("returns true for identified nicks identified to requested nickname.", function (done) {
                isIdentifiedAs('identified-alt', 'identified')
                .then(function fulfilled (isIdentifiedAs) {
                    assert(isIdentifiedAs === true);
                    assert(off_spy.withArgs(handlers).calledOnce);
                })
                .then(done)
                .done();
            });

            it("times out after an hour", function (done) {
                isIdentifiedAs('timeout', 'identified')
                .then(function fulfilled (isIdentifiedAs) {
                    assert(!"called");
                }, function onTimeout (reason) {
                    assert(reason instanceof Error);
                    assert(reason.message === "Request timed out.");
                    assert(off_spy.withArgs(handlers).calledOnce);
                })
                .then(done)
                .done();
            });
        });
    });
});