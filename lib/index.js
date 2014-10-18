var index = {
        Client: 'client',
        Message: 'message',
        CommandHandler: 'command-handler'
    };
for (var m in index) {
    index[m] = require('./' + index[m]);
}
module.exports = index;