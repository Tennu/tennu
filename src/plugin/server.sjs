module.exports = {
    init: function (client, deps) {
        const isupport = {};

        deps.messages.isupport(isupport);

        return {
            handlers: {
                '005': function (isupportMessage) {
                    isupportMessage.params.slice(1, -1).map(function (param) {
                        return param.split('=');
                    }).forEach(function (param) {
                        // Note(Havvy): param is either [param] or [param, value]
                        if (param.length === 1) {
                            isupport[param[0]] = true;
                        } else {
                            isupport[param[0]] = param[1];
                        }
                    });
                }
            },

            exports: {
                isupport: isupport
            }
        };
    },

    requires: ["messages"]
};
