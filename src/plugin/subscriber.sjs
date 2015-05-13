const Subscriber = require("prefix-event-subscriber");
const format = require("util").format;

module.exports = {
    init: function (client, deps) {
        const subscriber = Subscriber();

        return {
            hooks: {
                subscribe: function (plugin, data) {
                    const prefix = data.prefix;
                    const emitter = data.emitter;
                    const acceptsMetadata = data.acceptsMetadata || false;

                    client.note("Tennu", format("Subscriber '%s' registered for plugin '%s'.", typeof prefix === "string" ? prefix : "(no-prefix)", plugin));
                    subscriber.addEmitter(prefix, emitter, acceptsMetadata);
                },

                handlers: function (plugin, handles) {
                    subscriber.onWithMetadata(handles, {plugin: plugin});
                }
            },

            exports: {
                defaultPrefix: Subscriber.defaultPrefix,
                on: subscriber.on,
                off: subscriber.off,
                once: subscriber.once,
                onWithMetadata: subscriber.onWithMetadata,
                offWithMetadata: subscriber.offWithMetadata,
                onceWithMetadata: subscriber.onceWithMetadata
            }
        };
    }
};