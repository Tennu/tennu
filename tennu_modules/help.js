const HELP_NOT_FOUND = 'Help file for selected topic does not exist.';

const isArray = require('util').isArray;
const format = require('util').format;
const Set = require('simplesets').Set;

module.exports = {
    init: function (client, imports) {
        const registry = {};
        const commandset = new Set();

        function helpResponse (query) {
            const cursor = query.reduce(function (cursor, topic) {
                if (typeof cursor !== 'object') {
                    return undefined;
                }

                if (cursor.hasOwnProperty(topic)) {
                    return cursor[topic];
                } else {
                    return undefined;
                }
            }, registry);

            if (cursor === undefined) {
                return HELP_NOT_FOUND;
            }

            if (typeof cursor === 'string' || Array.isArray(cursor)) {
                return cursor;
            }

            if (typeof cursor['*'] === 'string' || Array.isArray(cursor['*'])) {
                return cursor['*'];
            }

            return HELP_NOT_FOUND;
        }

        return {
            handlers: {
                '!help': function (command) {
                    // Default to showing the help for the help module if no args given.
                    const query = command.params.length === 0 ? ['help'] : command.params.slice();

                    return helpResponse(query)
                },

                '!commands': function (command) {
                    const start = ["List of known commands: "];
                    return start.concat(commandset.array().map(function (command) {
                        return format(" * %s", command);
                    }));
                }
            },

            exports: {
                help: helpResponse,
                helpObject: function () { return JSON.parse(JSON.stringify(registry)); },
                HELP_NOT_FOUND: HELP_NOT_FOUND
            },

            hooks: {
                help: function (module, help) {
                    if (typeof help === 'string') {
                        registry[module] = {'*': help}
                        return;
                    }

                    if (Array.isArray(help)) {
                        registry[module] = {'*': help}
                        return;
                    }

                    if (typeof help === 'object') {
                        Object.keys(help).forEach(function (key) {
                            if (key === '*') {
                                registry[module] = help['*'];
                            }

                            registry[key] = help[key];
                        });
                        return;
                    }

                    throw new TypeError(format('Help property for module %s is invalid.', module));
                },

                commands: function (module, commands) {
                    if (!Array.isArray(commands)) {
                        throw new TypeError(format('Commands property for module %s is invalid.', module));
                    }

                    commands.forEach(function (command) {
                        if (typeof command !== 'string') {
                            throw new TypeError(format('Commands property for module %s is invalid.', module));
                        }

                        commandset.add(command);
                    });
                }
            },

            help: {
                help: [
                    '!help <query>',
                    '',
                    'Display the help message for the topic located at the given query.',
                    'Query can be made of multiple subtopics',
                    'Without a query, shows this help message.',
                    '',
                    'Ex: !help commands',
                    'Ex: !help uno start'
                ],

                commands: [
                    '!commands',
                    '',
                    'Show the list of commands.'
                ]
            },

            commands: ['help', 'commands']
        };
    }
};