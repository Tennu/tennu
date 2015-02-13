const Promise = require("bluebird");
const format = require("util").format;

module.exports = {
    init: function (client, imports) {
        const isIdentifiedAs = function(nickname, accountname) {
            client.debug("PluginUser", format("isIdentifiedAs(%s, %s)", nickname, accountname));

            return client.whois(nickname)
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