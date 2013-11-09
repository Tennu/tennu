/**
 *
 * An immutable representation of a command.
 *
 */

module.exports = function Command (sender, msg, channel, isQuery) {
    var args = msg.split(' ');
    var name = args.shift().toLowerCase();
    return Object.freeze({
        sender: sender,
        args: Object.freeze(args),
        channel: channel,
        name: name,
        isQuery: isQuery || false
    });
};
