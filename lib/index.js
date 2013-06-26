var index = {
    Client: "client",
    Message : 'structures/message',
    Command : 'structures/command',
    Hostmask : 'structures/hostmask',
    OutputSocket : 'output-socket',
    MessageParser : 'message-parser',
    // ChunkedMessageParser: 'chunked-message-parser',
    CommandParser : 'command-parser',
    Bisubscriber : 'bisubscriber'
};

for (var m in index) {
    index[m] = require('./' + index[m]);
}

module.exports = index;
