const format = require("util").format;
const Promise = require("bluebird");

module.exports = function (client, rawf) {
    return function (channel) {
        return new Promise(function (resolve, reject) {
            if (channel === undefined || channel === "") {
                reject(new Error("No channel given to join action."));
                return;
            }

            const response = {
                names: []
            };

            // Only listen to events for the channel we care about.
            const forChannel = function (handler) {
                return function (message) {
                    if (message.channel === channel) {
                        handler(message);
                    }
                }
            }

            // const onJoin = forChannel(function (join) {
            //     // Nothing?
            // });

            const onTopic = forChannel(function (topic) {
                response.topic = topic.topic;
            });

            const onTopicWhoTime = forChannel(function (topicWhoTime) {
                response.topicChange = {
                    who: topicWhoTime.who,
                    timestamp: topicWhoTime.timestamp
                };
            });

            const onNames = forChannel(function (names) {
                response.names = response.names.concat(names);
            });

            const onNamesEnd = forChannel(function (endofnames) {
                unsubscribe();
                Promise.resolve(response);
            });

            const onJoinError = forChannel(function (err) {
                unsubscribe();
                Promise.reject(err);
            });

            const handlers = {
                //join: onJoin,
                rpl_topic: onTopic,
                rpl_topicwhotime: onTopicWhoTime,
                rpl_namreply: onNames,
                rpl_endofnames: onNamesEnd,
                err_nosuchchannel: onJoinError,
                err_unavailresource: onJoinError,
                err_channelisfull: onJoinError,
                err_toomanychannels: onJoinError,
                err_inviteonlychan: onJoinError,
                err_bannedfromchan: onJoinError,
                err_badchannelkey: onJoinError,
                err_needreggednick: onJoinError,
                err_operonly: onJoinError
            };

            client.on(handlers);

            // Assume failure in an hour.
            setTimeout(function () {
                unsubscribe();
                client.error(format("Attempt to join %s failed.", channel));
            }, 3600 * 1000);

            const unsubscribe = function () {
                client.debug("PluginAction", format("Unsubscribing events for JOIN %s", channel));
                client.off(handlers);
            };

            rawf("JOIN :%s", channel);
        });
    };
};