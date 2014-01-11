var fez = require('fez');
var sweetjs = require('fez-sweet.js');

exports.build = function(rule) {
  rule.each("test-src/*.sjs", fez.mapFile("test/%f.js"), sweetjs({'modules': ['sweet-bdd']}));
};

exports.default = exports.build;

fez(module);