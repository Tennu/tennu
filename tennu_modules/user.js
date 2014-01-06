const Q = require('q');

module.exports = function (tennu, imports) {
    const isIdentifiedAs = function(nickname, accountname) {
        const deferred = Q.defer();
        nickname = nickname.toLowerCase();
        accountname = accountname.toLowerCase();

        const timeout = setTimeout(function () {
            unregister();
            tennu.error("isIdentifiedAs request timed out after one hour.");
            deferred.reject(new Error("Request timed out."));
        }, 1000 * 60 * 60);

        const fornick = function (fn) {
            return function (reply) {
                if (reply.nickname.toLowerCase() === nickname) {
                    fn(reply);
                } else {
                    tennu.debug("Whois response for another nick: " + reply.nickname);
                }
            }
        };

        const unregister = function () {
            tennu.off(handlers);
            clearTimeout(timeout)
        }

        const result = false; // Until proven otherwise.

        const onLoggedIn = fornick(function (reply) {
            if (reply.identifiedas.toLowerCase() === accountname) {
                tennu.debug("isIdentifiedAs found a match.");
                result = true;
            }
        });

        const onRegNick = fornick(function (reply) {
            if (nickname === accountname) {
                tennu.debug("isIdentifiedAs found a match.");
                result = true;
            }
        });

        const onWhoisEnd = fornick(function (reply) {
            tennu.debug("isIdentifiedAs found end of whois.");
            unregister();
            tennu.debug("Resolving " + result);
            deferred.resolve(result)
        });

        const onError = fornick(function (reply) {
            unregister();
            deferred.resolve(false);
        });

        const handlers = {
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