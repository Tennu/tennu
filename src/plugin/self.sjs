var format = require("util").format;

module.exports = {
    init: function (client, deps) {
        var myNickname = undefined;

        client._socket.startupPromise.then(function (startupResult) {
            startupResult.map(function (startup) {
                myNickname = startup.nickname;
            });
        });


        return {
            handlers: {
                "nick": function (message) {
                    client.debug("PluginSelf", format("old: %s, me: %s", message.old, myNickname));
                    if (message.old === myNickname) {
                        myNickname = message.new;
                    }
                }
            },

            exports: {
                nickname: function () {
                    return myNickname;
                }
            }
        };
    },

    requires: ["messages"]
};