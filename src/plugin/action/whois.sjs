const format = require("util").format;
const Promise = require("bluebird");
const ResultCtors = require("r-result");
const Ok = ResultCtors.Ok;
const Fail = ResultCtors.Fail;
const chunk = require("chunk");

module.exports = function (client, rawf, emitter) {
    // NOTE(Havvy): `multiple` should not be set by the user, it is used as a recusion flag.
    // TODO(Havvy) Figure out what the `server` parameter does.
    // TODO(Havvy) Move the multiple case to `whoisAll` or return a Promise<[Result<WhoisInfo, WhoisFailureMessage>], Error>`?
    return function whois (nickname, server, multiple) {

        // NOTE(Havvy): The logic in this block has two purposes.
        // 1) Check if input is of the correct types, throw an error if not.
        // 2) Determine whether multiple WHOISes.
        //      If multiple, fire and forget.
        //      If single, return a promise.
        if (Array.isArray(nickname)) {
            const nicknames = nickname; // rename for clarity
            if (nicknames.some(λ[typeof # !== "string"])) {
                throw new Error("Whois command takes either a string (a single nick) or an array (of string nicks)");
            }
            if (nicknames.length > 15) {
                chunk(nicknames, 15)
                .map(λ.join(','))
                .map(λ[whois(#, server, true)]);
            }
        } else if (typeof nickname === "string" && nickname.indexOf(",") !== -1) {
            multiple = true;
        } else if (typeof nickname === "string") {
            // NOOP
        } else {
            throw new Error("Whois command takes either a string (a single nick) or an array (of string nicks)");
        }

        if (server || multiple) {
            if (server) {
                rawf("WHOIS %s %s", server, nickname);
            } else {
                rawf("WHOIS %s", nickname);
            }
            return;
        }

        return new Promise(function (resolve, reject) {
            const whoisInfo = {
                nickname: nickname,
                username: undefined,
                hostname: undefined,
                hostmask: undefined,
                realname: undefined,
                identified: false,
                identifiedas: undefined,
                server: undefined,
                serverInfo: undefined,
                idleSeconds: undefined,
                loginTimestamp: undefined,
                secureConnection: false,
                isBot: false,
                isHelpop: false,
                isOper: false
            };

            function formatn (formatstr) {
                return format(formatstr, nickname);
            }

            function forNick (handler) {
                return function (message) {
                    if (message.nickname === nickname) {
                        return handler(message);
                    }
                };
            }

            const whoisUserHandler = forNick(function (message) {
                whoisInfo.username = message.username;
                whoisInfo.hostname = message.hostname;
                whoisInfo.hostmask = message.hostmask;
                whoisInfo.realname = message.realname;
            });

            const whoisRegisteredNickHandler = forNick(function (message) {
                client.debug("PluginAction", format("%s is identified as %s", nickname, nickname));
                whoisInfo.identified = true;
                whoisInfo.identifiedas = nickname;
            });

            const whoisLoggedInHandler = forNick(function (message) {
                client.debug("PluginAction", format("%s is identified as %s", nickname, message.identifiedas));
                whoisInfo.identified = true;
                whoisInfo.identifiedas = message.identifiedas;
            });

            const whoisServerHandler = forNick(function (message) {
                whoisInfo.server = message.server;
                whoisInfo.serverInfo = message.serverInfo;
            });

            const whoisIdleHandler = forNick(function (message) {
                whoisInfo.idleSeconds = message.seconds;
                whoisInfo.loginTimestamp = message.since;
            });

            const whoisChannelsHandler = forNick(function (message) {
                whoisInfo.channels = message.channels;
            });

            const whoisHostHandler = forNick(function (message) {
                whoisInfo.ip = message.ip;
            });

            const whoisSecureHandler = forNick(function (message) {
                whoisInfo.secureConnection = true;
            });

            const whoisBotHandler = forNick(function (message) {
                whoisInfo.isBot = true;
            });

            const whoisOperatorHandler = forNick(function (message) {
                whoisInfo.isOper = true;
            });

            const whoisHelpopHandler = forNick(function (message) {
                whoisInfo.isHelpop = true;
            });

            const endOfWhoisHandler = forNick(function (message) {
                unsubscribe();
                resolve(Ok(whoisInfo));
            });

            const errUnknownCommandHandler = function (message) {
                if (message.unknownCommand === "whois") {
                    unsubscribe();
                    resolve(Fail(message));
                }
            };

            const errDefaultHandler = forNick(function (message) {
                unsubscribe();
                resolve(Fail(message));
            });

            // TODO(Havvy): Determine which whois messages are being ignored.
            var handlers = {
                "rpl_whoisuser": whoisUserHandler,
                "rpl_whoisregnick": whoisRegisteredNickHandler,
                "rpl_whoisloggedin": whoisLoggedInHandler,
                "rpl_whoisserver": whoisServerHandler,
                "rpl_whoisidle": whoisIdleHandler,
                "rpl_whoischannels": whoisChannelsHandler,
                "rpl_whoishost": whoisHostHandler,
                "rpl_whoissecure": whoisSecureHandler,
                "rpl_whoisbot": whoisBotHandler,
                "rpl_whoisoperator": whoisOperatorHandler,
                "rpl_whoishelpop": whoisHelpopHandler,
                "rpl_endofwhois": endOfWhoisHandler,
                "err_unknowncommand": errUnknownCommandHandler,
                "err_nosuchnick": errDefaultHandler
            };

            client.debug("PluginAction", formatn("Registering handlers for WHOIS %s."));
            client.on(handlers);

            // Assume failure in an hour.
            var timeout = setTimeout(timeout = function () {
                unsubscribe();
                client.error(formatn("Attempt to whois %s failed."));
                reject(new Error(formatn("Whois attempt timed out for nickname %s.")));
            }, 3600 * 1000);

            var unsubscribe = function () {
                client.debug("PluginAction", formatn("Unsubscribing events for WHOIS %s"));
                client.off(handlers);
                clearTimeout(timeout);
            };

            client.debug("PluginAction", formatn("Attempting to whois %s."));
            rawf("WHOIS %s", nickname);
        })
        .tap(function (result) {
            emitter.emit("join", result);
        });
    };
};