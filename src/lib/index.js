var index = {
    Client: "client",
    Message : 'message',
    //MessageHandler : 'message-handler',
    CommandHandler : 'command-handler',
    //Bisubscriber : 'bisubscriber'
};

for (var m in index) {
    index[m] = require('./' + index[m]);
}

module.exports = index;
