const Q = require('q');
module.exports = {
    init: function (client, imports) {
        const isIdentifiedAs = function (nickname, accountname) {
            const deferred = Q.defer();
            nickname = nickname.toLowerCase();
            accountname = accountname.toLowerCase();
            const timeout = setTimeout(function () {
                    unregister();
                    client.error('PluginUser', 'isIdentifiedAs request timed out after one hour.');
                    deferred.reject(new Error('Request timed out.'));
                }, 1000 * 60 * 60);
            const fornick = function (fn) {
                return function (reply) {
                    if (reply.nickname.toLowerCase() === nickname) {
                        fn(reply);
                    } else {
                        client.debug('PluginUser', 'Whois response for another nick: ' + reply.nickname);
                    }
                };
            };
            const unregister = function () {
                client.debug('PluginUser', 'Unregistering isIdentifiedAs handlers.');
                client.off(handlers);
                clearTimeout(timeout);
            };
            var result = false;
            // Until proven otherwise.
            const onLoggedIn = fornick(function (reply) {
                    if (reply.identifiedas.toLowerCase() === accountname) {
                        client.debug('PluginUser', 'isIdentifiedAs found a match.');
                        result = true;
                    }
                });
            const onRegNick = fornick(function (reply) {
                    if (nickname === accountname) {
                        client.debug('PluginUser', 'isIdentifiedAs found a match.');
                        result = true;
                    }
                });
            const onWhoisEnd = fornick(function (reply) {
                    client.debug('PluginUser', 'isIdentifiedAs found end of whois.');
                    unregister();
                    client.debug('PluginUser', 'Resolving ' + result);
                    deferred.resolve(result);
                });
            const onError = fornick(function (reply) {
                    unregister();
                    deferred.resolve(false);
                });
            const handlers = {
                    'rpl_whoisregnick': onRegNick,
                    'rpl_whoisloggedin': onLoggedIn,
                    'rpl_endofwhois': onWhoisEnd,
                    'err_nosuchnick': onError
                };
            client.debug('Registerting isIdentifiedAs handlers');
            client.on(handlers);
            setImmediate(function () {
                client.whois(nickname);
            });
            return deferred.promise;
        };
        return { exports: { isIdentifiedAs: isIdentifiedAs } };
    }
};