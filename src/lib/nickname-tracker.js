var nicknameTracker = function (start, messageHandler) {
    var nickname = start;

    messageHandler.on('nick', function (message) {
        if (message.old === nickname) {
            nickname = message.new;
        }
    });

    return function () {
        return nickname;
    };
};

module.exports = nicknameTracker;