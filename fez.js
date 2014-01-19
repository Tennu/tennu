#!/usr/bin/env node

var fez = require('fez');
var sweetjs = require('fez-sweet.js');

exports.build = function(rule) {
    rule.each('test-src/*.sjs', fez.mapFile('test/%f.js'), sweetjs({'modules': ['sweet-bdd'], 'readableNames': true}));
    rule.each('src/*.sjs', fez.mapFile('lib/%f.js'), sweetjs({'modules': ['coco-js'], 'readableNames': true}))
};

exports.default = exports.build;
fez(module);