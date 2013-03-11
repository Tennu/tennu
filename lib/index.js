var index = {
    NRC : "nrc",
    nrc : "nrc",
    Nrc : "nrc",
    Client: "nrc",
    Message : 'structures/message',
    Command : 'structures/command',
    Hostmask : 'structures/hostmask',
    Socket : 'socket',
    OutputSocket : 'output-socket',
    MessageParser : 'irc-message-emitter',
    // ChunkedMessageParser: 'chunked-message-parser',
    CommandParser : 'commander',
    Modules : 'modules',
    Bisubscriber : 'bisubscriber'
};

for (var m in index) {
    index[m] = require('./' + index[m]);
}

module.exports = index;
