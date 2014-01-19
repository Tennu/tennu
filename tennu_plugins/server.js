/*

var util = require('util');

var ServerModule = function () {
    this.capabilities = {};
};

ServerModule.prototype.getModule = function () {
    return {
        name: "server",
        exports: {
            "capabilities" : this.capabilities
        },
        handlers: {
            "005" : this.isupportHandler.bind(this)
        },
        help: "Internal module. Right now only grabs the isupport info."
    };
};

ServerModule.prototype.isupportHandler = function (e) {
    // First parameter is my nickname!
    // Last parameter is plain text.
    for (var ix = 1; ix < e.args.length - 1; ix++) {
        var capability = e.args[ix].split("=");
        switch (capability.length) {
            case 1:
                this.capabilities[capability[0]] = true;
                break;
            case 2:
                this.capabilities[capability[0]] = capability[1];
        }
    }
};

module.exports = function (nrc) {
    return (new ServerModule()).getModule();
};

*/

module.exports = {
    init: function (tennu) {
        return {};
    }
};