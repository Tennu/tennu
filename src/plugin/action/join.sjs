/*
module.exports = function (client, action_module) {
    const server = action_module.imports.server;

    return function join (channel) {
        const deferred = Q.defer();
        const rawf = action_module.exports.rawf;
        const result = {};

        const unsubscribe = function () {
            messageHandler.off('join', onJoin);
        };

        const onJoin = function (join) {
            if (join.nickname !== client.nickname() || join.channel !== channel) {
                return;
            }

            result = join;
            deferred.resolve(result);
        };

        messageHandler.on('join', onJoin);

        rawf("JOIN :%s", channel);

        return deferred.promise;        
    }
};
*/