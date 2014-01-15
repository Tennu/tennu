const sinon$374 = require('sinon');
const assert$375 = require('better-assert');
const equal$376 = require('deep-eql');
const inspect$377 = require('util').inspect;
const format$378 = require('util').format;
const debug$379 = false;
const logfn$380 = debug$379 ? console.log.bind(console) : function () {
    };
const HelpModule$381 = require('../tennu_modules/help');
const moduleHelps$382 = {
        a: 'a *',
        b: {
            b: {
                '*': 'b *',
                b1: 'b 1',
                b2: [
                    'b 2_1',
                    'b 2_2'
                ],
                b3: { '*': 'b 3 *' }
            }
        },
        c: { c1: 'c 1' },
        d: [
            'd *_1',
            'd *_2'
        ]
    };
const client$383 = {
        config: function (value) {
            if (value === 'help-disabled') {
                return false;
            }
        }
    };
describe('Help module', function () {
    var instance$385, help$386, HELP_NOT_FOUND$387;
    beforeEach(function () {
        logfn$380();
        instance$385 = HelpModule$381.init(client$383, {});
        HELP_NOT_FOUND$387 = instance$385.exports.HELP_NOT_FOUND;
        instance$385.hooks.help('a', moduleHelps$382.a);
        instance$385.hooks.help('b', moduleHelps$382.b);
        instance$385.hooks.help('c', moduleHelps$382.c);
        instance$385.hooks.help('d', moduleHelps$382.d);
        help$386 = instance$385.exports.help;
    });
    it('returns HELP_NOT_FOUND for unknown topics', function () {
        assert$375(help$386(['dnd']) === HELP_NOT_FOUND$387);
    });
    it('returns HELP_NOT_FOUND for subtopics of unknown topics', function () {
        assert$375(help$386([
            'dne',
            'subtopic'
        ]) === HELP_NOT_FOUND$387);
    });
    it('assigns the topic of the module name the value of the string when given a string', function () {
        logfn$380(inspect$377(help$386(['a'])));
        assert$375(help$386(['a']) === 'a *');
    });
    it('assigns the topic of the module name the value of the array when given an array', function () {
        logfn$380(inspect$377(help$386(['d'])));
        assert$375(equal$376(help$386(['d']), [
            'd *_1',
            'd *_2'
        ]));
    });
    it('gives the * property of topics with an object value', function () {
        assert$375(help$386(['b']) === 'b *');
    });
    it('gives HELP_NOT_FOUND for topics with an object value without the * property', function () {
        assert$375(help$386(['c']) === HELP_NOT_FOUND$387);
    });
    it('gives the subtopic string value for subtopic type of string', function () {
        logfn$380(inspect$377(help$386([
            'b',
            'b1'
        ])));
        assert$375(help$386([
            'b',
            'b1'
        ]) === 'b 1');
    });
    it('gives the subtopic array value for subtopic type of array', function () {
        logfn$380(inspect$377(help$386([
            'b',
            'b2'
        ])));
        assert$375(equal$376(help$386([
            'b',
            'b2'
        ]), [
            'b 2_1',
            'b 2_2'
        ]));
    });
    it('gives the * property of subtopic type of object', function () {
        logfn$380(inspect$377(help$386([
            'b',
            'b3'
        ])));
        assert$375(help$386([
            'b',
            'b3'
        ]) === 'b 3 *');
    });
    it('gives HELP_NOT_FOUND for nonexistent subtopic of existing topic', function () {
        logfn$380(inspect$377(help$386([
            'b',
            'b4'
        ])));
        assert$375(help$386([
            'b',
            'b4'
        ]) === HELP_NOT_FOUND$387);
    });
});