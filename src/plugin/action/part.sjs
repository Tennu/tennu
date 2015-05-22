const format = require("util").format;
const Promise = require("bluebird");
const ResultCtors = require("r-result");
const Ok = ResultCtors.Ok;
const Fail = ResultCtors.Fail;

module.exports = function (client, rawf, emitter) {
    return function part (channel, reason) {
        if (channel.indexOf(" ") !== -1 ) {
            client.error("PluginAction", format("Attempt to part channel with spaces in it. Channels: %s", channel));
            throw new TypeError(format("Parting channel with spaces in it. Channels: %s", channel));
        }

        const partInfo = {
            channel: channel,
            reason: reason
        };

        if (channel.indexOf(",") !== -1) {
            client.warn("PluginAction", "Attempt to part multiple channels at once detected. Doing so, but auto-resolving to success.");

            rawf("PART %s :%s", channel, reason);
            return Promise.resolve(Ok(partInfo));
        }

        return new Promise(function (resolve, reject) {
            // Only listen to events for the channel we care about.
            const forChannel = function (handler) {
                return function (message) {
                    if (message.channel === channel) {
                        try {
                            handler(message);
                        } catch (e) {
                            reject(e);
                        }
                    }
                };
            };

            const formatc = function (formatstr) {
                return format(formatstr, channel);
            };

            const onSuccess = forChannel(function (partMessage) {
                unsubscribe();
                resolve(Ok(partInfo));
            });

            const onError = forChannel(function (partMessage) {
                unsubscribe();
                resolve(Fail(partMessage));
            });

            const handlers = {
                part: onSuccess,
                err_nosuchchannel: onError,
                err_notonchannel: onError
            };

            client.on(handlers);

            // Assume failure in an hour.
            var timeout = setTimeout(function () {
                unsubscribe();
                client.error(formatc("Attempt to part %s failed."));
                reject(new Error(formatc("Part attempt timed out for channel %s.")));
            }, 3600 * 1000);

            var unsubscribe = function () {
                client.debug("PluginAction", formatc("Unsubscribing events for PART %s"));
                client.off(handlers);
                clearTimeout(timeout);
            };

            client.debug("PluginAction", formatc("Attempting to part %s."));
            if (reason) {
                rawf("PART %s :%s", channel, reason);
            } else {
                rawf("PART %s", channel);
            }
        })
        .tap(function (partInfoResult) {
            emitter.emit("part", partInfoResult);
        });
    }
};