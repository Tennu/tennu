// Mock module with simple help statement.
var time = {
    help: "Gives the time of day with !time."
}

// Mock module with no help.
var place = {};

// Mock module with complex help.
var person = {
    help: {
        person: {
            "*": "Look up people via various services such as !wikiname and !googname",
            "wikiname": "Looks up the person on Wikipedia.",
            "googname": "Looks up the person on Google."
        },

        lookup: "Alias for !person."
    }
};

var mockTennu = {
    modules: {
        loaded: function () {
            return {
                time: time,
                place: place,
                person: person
            };
        }
    }
};

var helpModule = require('../tennu_modules/help')(mockTennu);
var help = helpModule.exports.getHelp;
var HELP_NOT_FOUND = helpModule.exports.HELP_NOT_FOUND;

describe('Help module', function () {
    it('gives no help found message for unregistered phrases', function () {
        expect(help(mockTennu, ['does_not_exist'])).toEqual(HELP_NOT_FOUND);
    });

    it('gives no help for modules without a help export', function () {
        expect(help(mockTennu, ['place'])).toEqual(HELP_NOT_FOUND);
    });

    it('gives no help for submodule checks for modules that do not exist', function () {
        expect(help(mockTennu, ['place', 'zipcode'])).toEqual(HELP_NOT_FOUND);
    });

    it('gives help for string help', function () {
        expect(help(mockTennu, ['time'])).toEqual([time.help]);
    });

    it('gives main help for object help', function () {
        expect(help(mockTennu, ['person'])).toEqual([person.help.person['*']]);
    });

    it('gives subhelp for object help with multiple words', function () {
        expect(help(mockTennu, ['person', 'wikiname'])).toEqual([person.help.person.wikiname]);
    });

    it('gives help not found for subtopics that do not exist', function () {
        expect(help(mockTennu, ['person', 'yahooname'])).toEqual(HELP_NOT_FOUND);
    });

    it('gives help for command not the name of the module', function () {
        expect(help(mockTennu, ['lookup'])).toEqual([person.help.lookup]);
    });
});
