const Q = require('q');
module.exports = {
    init: function (client, imports) {
        const isIdentifiedAs = function (nickname, accountname) {
            const deferred = Q.defer();
            nickname = nickname.toLowerCase();
            accountname = accountname.toLowerCase();
            const timeout = setTimeout(function () {
                    unregister();
                    client.error('isIdentifiedAs request timed out after one hour.');
                    deferred.reject(new Error('Request timed out.'));
                }, 1000 * 60 * 60);
            const fornick = function (fn) {
                return function (reply) {
                    if (reply.nickname.toLowerCase() === nickname) {
                        fn(reply);
                    } else {
                        client.debug('Whois response for another nick: ' + reply.nickname);
                    }
                };
            };
            const unregister = function () {
                client.off(handlers);
                clearTimeout(timeout);
            };
            var result = false;
            // Until proven otherwise.
            const onLoggedIn = fornick(function (reply) {
                    if (reply.identifiedas.toLowerCase() === accountname) {
                        client.debug('isIdentifiedAs found a match.');
                        result = true;
                    }
                });
            const onRegNick = fornick(function (reply) {
                    if (nickname === accountname) {
                        client.debug('isIdentifiedAs found a match.');
                        result = true;
                    }
                });
            const onWhoisEnd = fornick(function (reply) {
                    client.debug('isIdentifiedAs found end of whois.');
                    unregister();
                    client.debug('Resolving ' + result);
                    deferred.resolve(result);
                });
            const onError = fornick(function (reply) {
                    unregister();
                    deferred.resolve(false);
                });
            const handlers = {
                    'RPL_WHOISREGNICK': onRegNick,
                    'RPL_WHOISLOGGEDIN': onLoggedIn,
                    'RPL_ENDOFWHOIS': onWhoisEnd,
                    'ERR_NOSUCHNICK': onError
                };
            client.on(handlers);
            client.whois(nickname);
            return deferred.promise;
        };
        return { exports: { isIdentifiedAs: isIdentifiedAs } };
    }
};