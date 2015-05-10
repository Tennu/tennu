const format = require("util").format;
const inspect = require("util").inspect;
const EventEmitter = require("after-events");
const Message = require("../lib/message");
const Promise = require("bluebird");
const Response = require("../lib/response");

module.exports = {
    init: function (client, deps) {
        const emitter = Object.create(EventEmitter());
        var isupport;

        const parse = function (raw) {
            const message = new Message(raw, isupport);

            if (message === null) {
                client.error("Raw message given was not a valid IRC message!", raw);
                return null;
            }

            client.debug("MessageHandler", format("Emitting '%s'.", message.command.toLowerCase()));
            emitter.emit(message.command.toLowerCase(), message);

            if (message.replyname) {
                client.debug("MessageHandler", format("Emitting '%s'.", message.replyname.toLowerCase()));
                emitter.emit(message.replyname.toLowerCase(), message);
            }

            client.debug("MessageHandler", "Emitting '*'");
            emitter.emit("*", message);
            
            return message;
        };

        emitter.after(function (err, res, type, message) {
            // Intent := "say" | "act" | "ctcp" | "notice" | "none"
            // Target: NickName | ChannelName
            // ReturnResponse := {message: String | [CtcpType, CtcpBody], intent: Intent, target: Target, query: Boolean}
            // Result = undefined | string | [string] | ReturnResponse

            // err := Error
            // res := Result | Promise<Result>
            // type := string
            // message := Message

            if (err) {
                client.error("MessageHandler", "Error thrown in message handler!");
                client.error("MessageHandler", err.stack);
                return;
            }

            if (message.channel !== undefined) {
                Promise.resolve(res)
                .then(λ[Response.create(#, message)])
                .then(λ[Response.send(#, client)])
                .catch(λ[client.error("MessageHandler", format("MessageHandler for '%s' returned invalid response `%s`.", message.message, inspect(res)))])
            }
        });

        client._socket.on("data", parse);

        return {
            subscribe: {
                prefix: deps.subscriber.defaultPrefix,
                emitter: emitter
            },

            exports: {
                isupport: λ[isupport = #],
                afterEmit: emitter.after.bind(emitter)
            }
        };
    },

    requires: ["subscriber", "action"]
}