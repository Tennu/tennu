#! /usr/bin/env node

var program = require('commander');
var Client = require('../lib/client.js');
var fs = require('fs');

program
  .version('0.7.0')
  .usage('[options] <config file>')
  .option('-v, --verbose', 'Log to standard out')
  .parse(process.argv);

var config_path = program.args[0];

if (!config_path) {
    console.log("No config path given!");
    process.exit(1);
}

config_path = process.cwd() + '/' + config_path;

try {
    var config = fs.readFileSync(config_path, {encoding: 'utf-8'});
} catch (e) {
    console.log("Error detected!");
    console.log(e);
    process.exit(2);
}

try {
    config = JSON.parse(config)
} catch (e) {
    console.log(e);
    process.exit(3);
}

var di = {};

if (program.verbose) {
    var log = function (level) { 
        return function (line) {
            console.log(String(Date()), level, line);
        };
    };

    var Logger = function () {
        return {
            debug: function () {},
            info: log('info'),
            notice: log('notice'),
            warn: log('warn'),
            error: log('error'),
            crit: log('crit'),
            alert: log('alert'),
            emerg: log('emerg')
        };
    };

    di.Logger = Logger;
}

try {
    var client = Client(config, di);
    client.connect();
} catch (e) {
    console.log("Error occurred creating and connecting to Tennu instance.");
    console.log(e);
    process.exit(4);
}