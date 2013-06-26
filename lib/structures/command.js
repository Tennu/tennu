module.exports = function command (sender, msg, channel, isQuery) {
    var args = msg.split(' ');
    return {
        sender: sender,
        args: args,
        channel: channel,
        name: args.shift().toLowerCase(),
        isQuery: isQuery || false
    };
};
