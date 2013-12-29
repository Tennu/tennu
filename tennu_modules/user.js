var Q = require('q');

module.exports = function (tennu) {
    var isIdentifiedAs = function(nickname, accountname) {
        var deferred = Q.defer();
        nickname = nickname.toLowerCase();
        accountname = accountname.toLowerCase();

        var timeout = setTimeout(function () {
            unregister();
            tennu.error("isIdentifiedAs request timed out after one hour.");
            deferred.reject(new Error("Request timed out."));
        }, 1000 * 60 * 60);

        var fornick = function (fn) {
            return function (reply) {
                if (reply.nickname.toLowerCase() === nickname) {
                    fn(reply);
                } else {
                    tennu.debug("Whois response for another nick: " + reply.nickname);
                }
            }
        };

        var unregister = function () {
            tennu.off(handlers);
            clearTimeout(timeout)
        }

        var result = false; // Until proven otherwise.

        var onLoggedIn = fornick(function (reply) {
            if (reply.identifiedas.toLowerCase() === accountname) {
                tennu.debug("isIdentifiedAs found a match.");
                result = true;
            }
        });

        var onRegNick = fornick(function (reply) {
            if (nickname === accountname) {
                tennu.debug("isIdentifiedAs found a match.");
                result = true;
            }
        });

        var onWhoisEnd = fornick(function (reply) {
            tennu.debug("isIdentifiedAs found end of whois.");
            unregister();
            tennu.debug("Resolving " + result);
            deferred.resolve(result)
        });

        var onError = fornick(function (reply) {
            unregister();
            deferred.resolve(false);
        });

        var handlers = {
            "RPL_WHOISREGNICK": onRegNick,
            "RPL_WHOISLOGGEDIN": onLoggedIn,
            "RPL_ENDOFWHOIS": onWhoisEnd,
            "ERR_NOSUCHNICK": onError
        };

        tennu.on(handlers);
        tennu.whois(nickname);

        return deferred.promise;
    };

    return {
        exports: {
            isIdentifiedAs: isIdentifiedAs
        }
    };
};