const Promise = require("bluebird");
const format = require("util").format;

module.exports = {
    init: function (client, imports) {
        const isIdentifiedAs = function isIdentifiedAs (nickname, accountname, opts) {
            client.debug("PluginUser", format("isIdentifiedAs(%s, %s)", nickname, accountname));
            const memoizeOver = (opts && opts.memoizeOver) || false;

            return client.whois(nickname, false, {memoizeOver: memoizeOver})
            .then(function (result) {
                return result
                .map(function (whoisInfo) {
                    if (whoisInfo.identified) {
                        return whoisInfo.identifiedas.toLowerCase() === accountname.toLowerCase();
                    } else {
                        return false;
                    }
                })
                .unwrapOr(false);
            }, function (err) {
                client.error("PluginUser", err);
                client.error("PluginUser", err.stack);
                return false;
            });
        };

        return {
            exports: {
                isIdentifiedAs: isIdentifiedAs
            }
        };
    }
};