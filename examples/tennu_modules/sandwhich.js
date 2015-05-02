var format = require("util").format;
var types = ["ham", "pb&b"];

module.exports = function (tennu) {
    return {
        dependencies: [],
        exports: {
            help: {
                sandwhich: "Makes a sandwhich for you."
            };
        },
        handlers: {
            "!sandwhich" : function (command) {
                var requester = command.nickname;
                var type = types[Math.floor(Math.random() * types.length)];

                return format("%s: Have a %s sandwhich.", requester, type);
            }
        }
    };
};