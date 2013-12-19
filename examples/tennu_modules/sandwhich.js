var types = ['ham', 'pb&b'];

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

                return requester + ": Have a " + type + " sandwhich.";
            }
        }
    };
};