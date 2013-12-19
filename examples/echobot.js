// EXAMPLE MODULE
// Shows how to use .on(), some properties of Message and privmsg, and one way of responding.

var config = require('./config.json');
var Client = require('tennu').Client;

var tennu = Client(config);

// Simple echo capabilities.
tennu.on('privmsg', function (privmsg) {
    // Only echo in channels.
    if (privmsg.isQuery) {
        return;
    }

    // Don't repeat yourself.
    if (privmsg.nickname === tennu.nick()) {
        return;
    }

    return privmsg.message;
});

tennu.connect();