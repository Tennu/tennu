/**
 *
 * A Response is a struct with three fields:
 *
 * intent: "say" | "act" | "notice" | "ctcpResponse" | "ctcpRequest" "none"
 * message: String | [SingleWordString, String]
 * target: Target
 *
 * The "message" is always a String unless the intent is "ctcpResponse".
 *
 * When the intent is "none", no message should be sent.
 * When the intent is "say" or "notice", a "privmsg" or "notice"
 *      should be sent.
 * When the intent is "ctcpResponse", a CTCP should be sent with the type
 *      being the first value and the body being the second.
 * When the intent is "act", it is equivalent to a CTCP where the
 *      type is "ACTION" and the body is the message.
 *
 *
 * When creating a response from the return value of a handler,
 * what happens depends on the type.
 *
 * undefined:  The intent shall be "none", with the other values left
 *             undefined, since they are unused.
 * string | [string]:  The intent shall be "say", with the value
 *                     used as the message. The target will be the
 *                     original channel or query that the handler
 *                     is responding to.
 * object with #toIrcResponse\1:  Returns what this method returns.
 *                                We assume that the object impls
 *                                this correctly by calling `create`
 *                                again with different arguments.
 * object: The object must have a message property. If there is no
 *         intent property, the intent is set to "say". If there is
 *         a query property, and it is true, then the target is set to
 *         a query of the sender of the message being handled. Otherwise,
 *         it is set to the value of the "target" property on the object,
 *         defaulting to the original channel or query the handler is
 *         responding to.
 *
 **/

const Response = Object.freeze({
    /// create(FromResponse, IrcMessage) -> IrcResponse
    /// Polymorphic (megamorphic too) method for creating responses.
    create: function (fromResponse, message) {
        switch (typeof fromResponse) {
            case "undefined": return Response.fromUndefined(fromResponse, message);
            case "string": return Response.fromString(fromResponse, message);
            case "object":
                if (Array.isArray(fromResponse)) {
                    return Response.fromArray(fromResponse, message);
                } 

                if (fromResponse === null) {
                    return Response.fromUndefined(fromResponse, message);
                }

                if (typeof fromResponse.toIrcResponse === "function") {
                    return fromResponse.toIrcResponse(message);
                } 

                if (typeof fromResponse.message === "string") {
                    return Response.fromPlainObject(fromResponse, message);
                } 

                throw new TypeError("Cannot create response from object. No string 'message' or function 'toIrcResponse' property. Must have one or the other.")
            default: throw new TypeError("Cannot create response from passed value of type " + typeof fromResponse);
        }
    },

    fromUndefined: function (_undefined, _message) {
        return {
            intent: "none",
            message: undefined,
            target: undefined
        };
    },

    fromString: function (string, message) {
        return {
            intent: "say",
            message: string,
            target: message.channel
        };
    },

    /// fromPlainObject(Object, IrcMessage) -> IrcResponse
    /// At minimum, requires that the 'message' property exist on it as a string.
    /// If the intent is left out, defaults to "say".
    /// If the 'query' field in the plain Object is truthy, it forces the target to
    /// be the sender of the IrcMessage, otherwise, if there's a target property
    /// on the plain message, it is sent to that. Failing that, the message is sent
    /// to the originating channel, which may be a query.
    fromPlainObject: function (plainObject, message) {
        return {
            message: plainObject.message,
            intent: plainObject.intent || "say",
            target: plainObject.query ? message.nickname : (plainObject.target || message.channel)
        };
    },

    // Note(Havvy): This will soon have different behaviour that
    //              behaves the same for all current use cases.
    fromArray: function (array, message) {
        return {
            intent: "say",
            message: array,
            target: message.channel
        };
    },

    send: function (response, client) {
        const intents = {
            say: λ[client.say(#, #)],
            act: λ[client.act(#, #)],
            notice: λ[client.notice(#, #)],
            none: λ[undefined],
            ctcp: function {
                (target, [tag, message]) => {
                    client.warn("Tennu", "Received response with deprecated intent 'ctcp'. Change to 'ctcpRespond'.");
                    client.ctcpRespond(target, tag, message);
                },

                (target, [tag]) => {
                    client.warn("Tennu", "Received response with deprecated intent 'ctcp'. Change to 'ctcpRespond'.");
                    client.ctcpRequest(target, tag);
                }
            },
            ctcpRespond: function {
                (target, [tag, message]) => client.ctcpRespond(target, tag, message)
            },
            ctcpRequest: function {
                (target, [tag, message]) => client.ctcpRequest(target, tag, message),
                (target, [tag]) => client.ctcpRequest(target, tag)
            }
        };

        intents[response.intent](response.target, response.message);
    }
});

module.exports = Response;