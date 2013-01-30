var util = require('util');

var capabilities = {};

var _005Handler = function (e) {
    // First parameter is my nickname!
    // Last parameter is plain text.
    for (var ix = 1; ix < e.parameters.length - 1; ix++) {
        var param = e.parameters[ix].split("=");
        switch (param.length) {
            case 1:
                capabilities[param[0]] = true;
                break;
            case 2:
                capabilities[param[0]] = param[1];
        }
    }
};

module.exports = {
    name: "server",
    exports: {
        "capabilities" : capabilities
    },
    handlers: {
        "005" : _005Handler
    }
};