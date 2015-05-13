var index = {
    Client: "client",
    Message : "message",
    Response: "response"
};

for (var m in index) {
    index[m] = require('./' + index[m]);
}

module.exports = index;
