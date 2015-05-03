var IrcSocket = require("irc-socket");
var format = require("util").format;

module.exports = {
    init: function (client) {
        const nickname = client.config("nickname");
        const authPassword = client.config("auth-password");
        const nickserv = client.config("nickserv");
        const autojoinChannels = client.config("channels");

        client._socket.startupPromise.then(function (startupResult) {
            startupResult
            .map(function (startupInfo) {
                client.note("Tennu", "Server connection started.");

                if (client.config("daemon") === "unreal") {
                    // Mode +B on Unreal signifies a bot.
                    client.mode(nickname, "B");
                }

                if (authPassword) {
                    client.log("notice", "Tennu", "Identifying to services.");
                    client.say(nickserv, "identify " + authPassword);
                }

                if (Array.isArray(autojoinChannels)) {
                    client.log("notice", "Tennu", "Joining default channels.");
                    autojoinChannels.forEach(function (channel) {
                        client.join(channel);
                    });
                }
            })
            .mapFail(function (failure) {
                var reason = Object.keys(IrcSocket.connectFailures).filter(function (key) {
                    return IrcSocket.connectFailures[key] === failure;
                })[0];

                client.error(format("Client failed to connect because of: %s", reason));
            });
        });

        client._socket.on("data", function (line) {
            client.info("<-", line);
        });

        return {
            handlers: {
                // Standard event for IRC quitting.
                "error": function () {
                    client.note("Tennu", "Closing IRC Connection.");
                    client.disconnect();
                }
            }
        };
    },

    requires: ["messages"]
}