/*

var isArray = require('util').isArray;
var copyArray = function (array) {
    return array.slice();
};

var drill = function (object, path) {
    for (var ix = 0; ix < path.length; ix++) {
        if (typeof object !== "object" || object === null) {
            return undefined;
        }

        object = object[path[ix]];
    }

    return object;
};

var showModuleList = function (nrc, command) {
    var modules = [];
    nrc.getAllModuleExports().forEach(function (module) {
        if (module.help) {
            modules.append(module.name);
        }
    });
    nrc.say(command.sender, "Modules: " + modules.join(", "));
};

var getModuleHelp = function (nrc, moduleName) {
    if (nrc.isModule(moduleName)) {
        return nrc.getModuleExports(moduleName);
    } else {
        return undefined;
    }
};

var showHelp = function (nrc, command) {
    var toSay = "Help file for selected topic does not exist.";
    var moduleHelp = getModuleHelp(nrc, command.params.shift());
    var help = drill(moduleHelp, command.params);

    if (help) {
        if (typeof help === "string" || isArray(help)) {
            toSay = help;
        } else if (help.main) {
            toSay = help.main;
        }
    }

    nrc.say(command.sender, toSay);
};

module.exports = {
    name: "help",
    handlers: {
        "!help" : function (command) {
            if (command.params.length === 0) {
                showModuleList(this, command);
            } else {
                showHelp(this, command);
            }
        }
    }
};
*/

module.exports = function (tennu) {
    return {};
};