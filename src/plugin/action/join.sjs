const format = require("util").format;
const Promise = require("bluebird");
const ResultCtors = require("r-result");
const Ok = ResultCtors.Ok;
const Fail = ResultCtors.Fail;

module.exports = function (client, rawf, emitter) {
    return function (channel) {
        return new Promise(function (resolve, reject) {
            if (channel === undefined || channel === "") {
                reject(new Error("No channel given to join action."));
                return;
            }

            const joinInfo = {
                names: [],
                channel: channel,
                nickname: client.nickname(),
                topic: {}
            };

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

            // const onJoin = forChannel(function (join) {
            //     // There's no actual data we need on the JOIN event itself.
            // });

            const onTopic = forChannel(function (topic) {
                client.debug("PluginAction", formatc("Handling RPL_TOPIC for %s."));
                joinInfo.topic.topic = topic.topic;
            });

            const onTopicWhoTime = forChannel(function (topicWhoTime) {
                client.debug("PluginAction", formatc("Handling RPL_TOPICWHOTIME for %s."));
                joinInfo.topic.setter = topicWhoTime.who;
                joinInfo.topic.timestamp = topicWhoTime.timestamp;
            });

            const onNames = forChannel(function (names) {
                client.debug("PluginAction", formatc("Handling RPL_NAMREPLY for %s."));
                joinInfo.names = joinInfo.names.concat(names.nicknames);
            });

            const onNamesEnd = forChannel(function () {
                client.debug("PluginAction", formatc("Handling RPL_ENDOFNAMES for %s."));
                unsubscribe();
                resolve(Ok(joinInfo));
            });

            const onJoinFail = forChannel(function (failMessage) {
                client.debug("PluginAction", formatc("Handling Join Error for %s."));
                client.debug("PluginAction", require('util').inspect(failMessage));
                unsubscribe();
                client.debug("PluginAction", formatc("Resolving Ok(...) for %s."))
                resolve(Fail(failMessage));
            });

            const handlers = {
                //join: onJoin,
                rpl_topic: onTopic,
                rpl_topicwhotime: onTopicWhoTime,
                rpl_namreply: onNames,
                rpl_endofnames: onNamesEnd,
                err_nosuchchannel: onJoinFail,
                err_unavailresource: onJoinFail,
                err_channelisfull: onJoinFail,
                err_toomanychannels: onJoinFail,
                err_inviteonlychan: onJoinFail,
                err_bannedfromchan: onJoinFail,
                err_badchannelkey: onJoinFail,
                err_needreggednick: onJoinFail,
                err_operonly: onJoinFail
            };

            client.debug("PluginAction", formatc("Registering handlers for JOIN %s."));
            client.on(handlers);

            // Assume failure in an hour.
            var timeout = setTimeout(function () {
                unsubscribe();
                client.error(formatc("Attempt to join %s failed."));
                reject(new Error(formatc("Join attempt timed out for channel %s.")));
            }, 3600 * 1000);

            var unsubscribe = function () {
                client.debug("PluginAction", formatc("Unsubscribing events for JOIN %s"));
                client.off(handlers);
                clearTimeout(timeout);
            };

            client.debug("PluginAction", formatc("Attempting to join %s."));
            rawf("JOIN :%s", channel);
        })
        .tap(function (result) {
            emitter.emit("join", result);
        });
    };
};