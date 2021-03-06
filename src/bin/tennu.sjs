var program = require("commander");
var Client = require("../lib/client.js");
var fs = require("fs");
var inspect = require("util").inspect;
var format = require("util").format;

program
  .version("1.0.0")
  .usage("[options] <config file>")
  .option("-v, --verbose", "Log to standard out")
  .option("-d, --debug", "Log debug messages. Requires -v")
  .parse(process.argv);


// Get the configuration.
var config_path = program.args[0];

if (!config_path) {
    console.log("Error: No config path given.");
    process.exit(1);
}

config_path = process.cwd() + "/" + config_path;

try {
    var config = fs.readFileSync(config_path, {encoding: "utf-8"});
} catch (e) {
    console.log(format("Unknown Error (%s) detected!", e.name));
    console.log();
    console.log(e.stack);
    process.exit(2);
}

try {
    config = JSON.parse(config)
} catch (e) {
    console.log("Failed to parse configuration file.");
    console.log();
    console.log(e.stack);
    process.exit(3);
}

if (program.verbose) {
    console.log(format("Connecting to %s:%d.", config.server, config.port));
}

// Create the dependency management object.
var parts = {};

if (program.verbose) {
    var log = function (level) { 
        return function () {
            var args = Array.prototype.slice.call(arguments)
                .map(function (arg) {
                    if (typeof arg === "object") {
                        return inspect(arg);
                    } else {
                        return String(arg);
                    }
                });
            console.log(String(Date()), level, args.join(" "));
        };
    };

    parts.Logger = {
        debug: program.debug ? log("debug") : function () {},
        info: log("info"),
        notice: log("notice"),
        warn: log("warn"),
        error: log("error"),
        crit: log("crit"),
        alert: log("alert"),
        emerg: log("emerg")
    };
}

// Try to connect, or print why it couldn"t.
try {
    var client = Client(config, parts);
    client.connect();
} catch (e) {
    console.log("Error occurred creating and connecting to Tennu instance.");
    console.log();
    console.log(e.stack);
    process.exit(4);
}

// Register hangup functions
var onabort = function self () {
    if (!self.attemptedToQuitAlready) {
        client.quit("Bot terminated.");
    } else {
        process.exit(1);
    }
};

process.on("SIGHUP", onabort);
process.on("SIGINT", onabort);
process.on("SIGQUIT", onabort);
process.on("SIGABRT", onabort);
process.on("SIGTERM", onabort);