const sinon = require("sinon");
const assert = require("better-assert");
const equal = require("deep-eql");
const inspect = require("util").inspect;
const format = require("util").format;
require("source-map-support").install();

const debug = false;
const logfn = debug ? console.log.bind(console) : function () {};

const UserPluginFactory = require("../tennu_plugins/user.js");

// NOTE(Havvy): For mock whois method.
const Promise = require("bluebird");
// This test file has false positives.
Promise.onPossiblyUnhandledRejection(undefined);

const ResultCtors = require("r-result");
const Ok = ResultCtors.Ok;
const Fail = ResultCtors.Fail;

describe("User Plugin", function () {
    var userPlugin, client;

    const errorPromise = Promise.reject(new Error("An Error"));
    errorPromise.suppressUnhandledRejections();

    const whoisReturns = {
        "failure": Fail({}),
        "unidentified": Ok({
            identified: false,
            identifiedas: undefined
        }),
        "identified-self": Ok({
            identified: true,
            identifiedas: "identified-self"
        }),
        "identified-alt": Ok({
            identified: true,
            identifiedas: "identified-self"
        }),
        "identified-other": Ok({
            identified: true,
            identifiedas: "identified-other"
        }),
        "CaSe": Ok({
            identified: true,
            identifiedas: "case"
        }),
        "error": errorPromise
    };

    beforeEach(function () {
        logfn(/* newline */);

        client = {
            debug: logfn,
            error: logfn,
            whois: function (nickname) {
                assert(nickname in whoisReturns);

                return Promise.resolve(whoisReturns[nickname])
                .then(function (v) {
                    logfn(inspect(v));
                    return v;
                });
            }
        };

        userPlugin = UserPluginFactory.init(client, {});
    });

    describe("isIdentifiedAs", function () {
        var isIdentifiedAs;

        beforeEach(function () {
            isIdentifiedAs = userPlugin.exports.isIdentifiedAs;
        });

        it("returns false for unidentified nicks", function () {
            return isIdentifiedAs("unidentified", "identified-self")
            .then(function (isIdentifiedAs) {
                assert(isIdentifiedAs === false);
            });
        });

        it("returns true for identified to self", function () {
            return isIdentifiedAs("identified-self", "identified-self")
            .then(function (isIdentifiedAs) {
                assert(isIdentifiedAs === true);
            });
        });

        it("returns true for identified to self from an alt nickname", function () {
            return isIdentifiedAs("identified-alt", "identified-self")
            .then(function (isIdentifiedAs) {
                assert(isIdentifiedAs === true);
            });
        });

        it("returns false for identified to an other nickname", function () {
            return isIdentifiedAs("identified-other", "identified-self")
            .then(function (isIdentifiedAs) {
                assert(isIdentifiedAs === false);
            });
        });

        it("returns false when whois fails", function () {
            return isIdentifiedAs("failure", "identified-self")
            .then(function (isIdentifiedAs) {
                assert(isIdentifiedAs === false);
            });
        });

        it("returns false when client.whois() errors", function () {
            return isIdentifiedAs("error", "identified-self")
            .then(function (isIdentifiedAs) {
                assert(isIdentifiedAs === false);
            });
        });

        it("is case insensitive", function () {
            return isIdentifiedAs("CaSe", "cAsE")
            .then(function (isIdentifiedAs) {
                assert(isIdentifiedAs === true);
            });
        });
    });
});