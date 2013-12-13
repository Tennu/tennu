var index = {
    Client: "client",
    Message : 'message',
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
