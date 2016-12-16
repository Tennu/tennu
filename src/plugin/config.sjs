const format = require("util").format;
const inspect = require("util").inspect;

module.exports = {
    name: "config",

    init: function (client, deps) {
        const config = client._configObject;

        if (config.daemon === "irc2") {
            if (config.capabilities && config.capabilities.requires && config.capabilities.requires.length > 0) {
                throw new Error("IRCd doesn't support capabilities. Cannot require them. Fix your configuration.");
            }
            // GameSurge doesn't support capabilities.
            config.capabilities = undefined;
        } else if (config.daemon !== "twitch") {
            if (!config.capabilities) {
                config.capabilities = { requires: ["multi-prefix"] };
            } else if (!config.capabilities.requires) {
                config.capabilities.requires = ["multi-prefix"];
            } else {
                if (config.capabilities.requires.indexOf("multi-prefix") === -1) {
                    config.capabilities.requires.push("multi-prefix");
                }
            }
        }
        
        client._config = client.getPlugin("config");

        return {
            exports: {
                "get": function (key) {
                    return config[key];
                }
            },

            staticHooks: {
                "configDefaults": function (pluginName, defaultConfiguration) {
                    Object.keys(defaultConfiguration).forEach(function (key) {
                        if (!(key in config)) {
                            config[key] = defaultConfiguration[key];
                        }
                    });
                }
            }
        };
    }
};
