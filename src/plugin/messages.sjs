const format = require("util").format;
const EventEmitter = require("after-events");
const Message = require("../lib/message");
const Promise = require("bluebird");
const Response = require("../lib/response");

module.exports = {
    init: function (client, deps) {
        const parser = Object.create(EventEmitter());
        var isupport;

        parser.parse = function (raw) {
            const message = new Message(raw, isupport);

            if (message === null) {
                client.error("Raw message given was not a valid IRC message!", raw);
                return null;
            }

            client.debug("MessageHandler", format("Emitting '%s'.", message.command.toLowerCase()));
            parser.emit(message.command.toLowerCase(), message);

            if (message.replyname) {
                client.debug("MessageHandler", format("Emitting '%s'.", message.replyname.toLowerCase()));
                parser.emit(message.replyname.toLowerCase(), message);
            }

            client.debug("MessageHandler", "Emitting '*'");
            parser.emit("*", message);
            
            return message;
        };

        parser.after(function (err, res, type, message) {
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
                .catch(λ[client.error("MessageHandler", format(badResponseFormat, message.message, inspect(res)))])
            }
        });

        client._socket.on("data", parser.parse.bind(this));

        return {
            subscribe: {
                prefix: deps.subscriber.defaultPrefix,
                emitter: parser
            },

            exports: {
                isupport: λ[isupport = #]
            }
        };
    },

    requires: ["subscriber", "action"]
}