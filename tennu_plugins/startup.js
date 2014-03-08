module.exports = {
    init: function (client) {
        const nick = client.config('nick');
        const authPassword = client.config('auth-password');
        const nickserv = client.config('nickserv');
        const autojoinChannels = client.config('channels');
        client._socket.on('ready', function () {
            // RAWR! I'm a <s>monster</s> Bot!
            client.mode(nick, 'B');
            if (authPassword) {
                client.log('notice', 'Tennu', 'Identifying to services.');
                client.say(nickserv, 'identify ' + authPassword);
            }
            if (Array.isArray(autojoinChannels)) {
                client.log('notice', 'Tennu', 'Joining default channels.');
                autojoinChannels.forEach(function (channel) {
                    client.join(channel);
                });
            }
        });
        client._socket.on('data', function (line) {
            client.info('<-', line);
        });
        // Standard event for IRC quitting.
        client.on('error', function () {
            client.note('Tennu', 'Closing IRC Connection.');
            client.disconnect();
        });
        return {};
    }
};