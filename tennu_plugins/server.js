module.exports = {
    init: function (client, imports) {
        const isupport = {};
        client._messageHandler.isupport(isupport);
        return {
            handlers: {
                '005': function (isupportMessage) {
                    isupportMessage.params.map(function (param) {
                        return param.split('=');
                    }).forEach(function (a0) {
                        var r0 = Object.prototype.toString, r6 = '[object Array]';
                        if (r0.call(a0) === r6 && a0.length === 1) {
                            var r13 = a0[0];
                            var supported = r13;
                            return isupport[supported] = true;
                        }
                        if (r0.call(a0) === r6 && a0.length === 2) {
                            var r14 = a0[0];
                            var r15 = a0[1];
                            var supported = r14, value = r15;
                            return isupport[supported] = value;
                        }
                        throw new TypeError('No match');
                    });
                }
            },
            exports: { isupport: isupport }
        };
    }
};