module.exports = {
    init: function (client, imports) {
        const isupport = {};

        return {
            handlers: {
                '005': function (isupportMessage) {
                    isupportMessage.params.map(function (param) {
                        return param.split('=');
                    }).forEach(function {
                        case ([supported]) => isupport[supported] = true;
                        case ([supported, value]) => isupport[supported] = value;
                        /*
                        const supported = supportedArray[0];
                        const value = supportedArray[1] || true;
                        isupport[supported] = value;
                        */
                    });
                }
            },

            exports: {
                isupport: isupport
            }
        };
    }
};