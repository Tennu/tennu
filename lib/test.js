var client = require('./client.js');

var config = {
    server: "irc.mibbit.net",
    nick: "tennu-test",
    user: "tennu"
};

client(config).connect();