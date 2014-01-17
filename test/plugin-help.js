const sinon$701 = require('sinon');
const assert$702 = require('better-assert');
const equal$703 = require('deep-eql');
const inspect$704 = require('util').inspect;
const format$705 = require('util').format;
const debug$706 = false;
const logfn$707 = debug$706 ? console.log.bind(console) : function () {
    };
const HelpModule$708 = require('../tennu_modules/help');
const moduleHelps$709 = {
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
const client$710 = {
        config: function (value) {
            if (value === 'help-disabled') {
                return false;
            }
        }
    };
describe('Help module', function () {
    var instance$712, help$713, HELP_NOT_FOUND$714;
    beforeEach(function () {
        logfn$707();
        instance$712 = HelpModule$708.init(client$710, {});
        HELP_NOT_FOUND$714 = instance$712.exports.HELP_NOT_FOUND;
        instance$712.hooks.help('a', moduleHelps$709.a);
        instance$712.hooks.help('b', moduleHelps$709.b);
        instance$712.hooks.help('c', moduleHelps$709.c);
        instance$712.hooks.help('d', moduleHelps$709.d);
        help$713 = instance$712.exports.help;
    });
    it('returns HELP_NOT_FOUND for unknown topics', function () {
        assert$702(help$713(['dnd']) === HELP_NOT_FOUND$714);
    });
    it('returns HELP_NOT_FOUND for subtopics of unknown topics', function () {
        assert$702(help$713([
            'dne',
            'subtopic'
        ]) === HELP_NOT_FOUND$714);
    });
    it('assigns the topic of the module name the value of the string when given a string', function () {
        logfn$707(inspect$704(help$713(['a'])));
        assert$702(help$713(['a']) === 'a *');
    });
    it('assigns the topic of the module name the value of the array when given an array', function () {
        logfn$707(inspect$704(help$713(['d'])));
        assert$702(equal$703(help$713(['d']), [
            'd *_1',
            'd *_2'
        ]));
    });
    it('gives the * property of topics with an object value', function () {
        assert$702(help$713(['b']) === 'b *');
    });
    it('gives HELP_NOT_FOUND for topics with an object value without the * property', function () {
        assert$702(help$713(['c']) === HELP_NOT_FOUND$714);
    });
    it('gives the subtopic string value for subtopic type of string', function () {
        logfn$707(inspect$704(help$713([
            'b',
            'b1'
        ])));
        assert$702(help$713([
            'b',
            'b1'
        ]) === 'b 1');
    });
    it('gives the subtopic array value for subtopic type of array', function () {
        logfn$707(inspect$704(help$713([
            'b',
            'b2'
        ])));
        assert$702(equal$703(help$713([
            'b',
            'b2'
        ]), [
            'b 2_1',
            'b 2_2'
        ]));
    });
    it('gives the * property of subtopic type of object', function () {
        logfn$707(inspect$704(help$713([
            'b',
            'b3'
        ])));
        assert$702(help$713([
            'b',
            'b3'
        ]) === 'b 3 *');
    });
    it('gives HELP_NOT_FOUND for nonexistent subtopic of existing topic', function () {
        logfn$707(inspect$704(help$713([
            'b',
            'b4'
        ])));
        assert$702(help$713([
            'b',
            'b4'
        ]) === HELP_NOT_FOUND$714);
    });
});