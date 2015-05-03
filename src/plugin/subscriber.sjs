const Subscriber = require("prefix-event-subscriber");

module.exports = {
    init: function (client, deps) {
        const subscriber = Subscriber();

        return {
            hooks: {
                subscribe: function (plugin, data) {
                    const prefix = data.prefix;
                    const emitter = data.emitter;

                    subscriber.addEmitter(prefix, emitter);
                },

                handlers: function (plugin, handles) {
                    subscriber.on(handles);
                }
            },

            exports: {
                defaultPrefix: Subscriber.defaultPrefix,
                on: subscriber.on,
                off: subscriber.off,
                once: subscriber.once
            }
        };
    }
};