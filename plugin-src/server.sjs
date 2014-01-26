module.exports = {
    init: function (client, imports) {
        const isupport = {};

        client._messageHandler.isupport(isupport);

        return {
            handlers: {
                '005': function (isupportMessage) {
                    isupportMessage.params.map(function (param) {
                        return param.split('=');
                    }).forEach(function {
                        case ([supported]) => isupport[supported] = true;
                        case ([supported, value]) => isupport[supported] = value;
                    });
                }
            },

            exports: {
                isupport: isupport
            }
        };
    }
};