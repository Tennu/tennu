/**
 *
 * Help Module
 * !help <phase>
 * 
 */

// Lookup algorithm:
// 1. If no phrase, respond with the help module's help message.
// 2. If phase is one word,
//   1. If the phrase is the same as a loaded module, and the loaded module's
//      help is simple, or an object with a "*", respond with that.
//   2. If a module's help is an object that has the phase as a key, respond with that.
// 3. If the phase is multiple words,
//   1. Map [firstword] to the module's help objects.
//   2. Filter out undefined values.
//   3. Repeat with the next work, until at the final word.
//   4. Do step 2 of the lookup using the values that are left.

// We are currently querying every module and grabbing their help property with every query.
// While this is theoretically bad performance, caching it would mean modules loaded after
// the help command is called will fail to show up.
// There are architectual changes that can be made to allow for this to work, but there
// are more pressing features to work on at this time.

var HELP_NOT_FOUND = "Help file for selected topic does not exist.";

var isArray = require('util').isArray;
var map = require('mout/object/map');
var values = require('mout/object/values');

var getModuleHelps = function (modules) {
    var exports = modules.loaded();

    return values(map(exports, function (mod, modname) {
        if (!mod.help) { return {}; }

        if (typeof mod.help === "string" || isArray(mod.help)) {
            var help = {};
            help[modname] = {"*": mod.help};
            return help;
        }

        return mod.help;
    }));
};

var makeResponseList = function (helps) {
    var response = [];

    helps.forEach(function (help) {
        if (typeof help === "string") {
            response.push(help);
        } else if (isArray(help)) {
            response = response.concat(help);
        } else if (help['*']) {
            response.push(help['*']);
        }
    });

    return response.length === 0 ? HELP_NOT_FOUND : response;
};

var getHelp = function (tennu, query) {
    var helps = getModuleHelps(tennu.modules);

    query.forEach(function (topic) {
        helps = helps.map(function (help) {
            return help[topic];
        }).filter(function (help) { return help !== undefined; });
    });

    var response = makeResponseList(helps);
    if (response.length === 0) { response = HELP_NOT_FOUND; }
    return response;
};

var showHelp = function (tennu, sender, query) {
    var toSay = getHelp(tennu, query);
    tennu.say(sender, toSay);
};

module.exports = function (tennu) {
    return {
        handlers: {
            "!help": function (command) {
                // Default to showing the help for the help module if no args given.
                var query = command.args.length === 0 ? ['help'] : command.args.slice();

                showHelp(tennu, command.sender, query)
            }
        },

        exports: {
            help: [
                "Use !help <topic> to get more assistance on a topic.",
                "Some topics may have subtopics to get assistance on."
            ],

            getHelp: getHelp,
            HELP_NOT_FOUND: HELP_NOT_FOUND
        }
    };
};