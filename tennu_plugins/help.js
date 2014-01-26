const HELP_NOT_FOUND = 'Help file for selected topic does not exist.';
const isArray = require('util').isArray;
const format = require('util').format;
const inspect = require('util').inspect;
const Set = require('simplesets').Set;
module.exports = {
    init: function (client, imports) {
        const enabled = !client.config('disable-help');
        if (!enabled) {
            // Empty module.
            return {};
        }
        const registry = {};
        const commandset = new Set();
        function helpResponseMessage(query) {
            const cursor = query.reduce(function (cursor$2, topic) {
                    if (typeof cursor$2 !== 'object') {
                        return undefined;
                    }
                    if (cursor$2.hasOwnProperty(topic)) {
                        return cursor$2[topic];
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
                    client.notice('ModHelp', '!help being handled.');
                    // Default to showing the help for the help module if no args given.
                    const query = command.args.length === 0 ? ['help'] : command.args.slice();
                    const response = helpResponseMessage(query);
                    return {
                        message: response,
                        query: true,
                        intent: 'say'
                    };
                },
                '!commands': function (command) {
                    client.notice('ModHelp', '!commands being handled.');
                    const start = ['List of known commands: '];
                    return start.concat(commandset.array().join(', '));
                }
            },
            exports: {
                help: helpResponseMessage,
                helpObject: function () {
                    return JSON.parse(JSON.stringify(registry));
                },
                HELP_NOT_FOUND: HELP_NOT_FOUND
            },
            hooks: {
                help: function (module$2, help) {
                    if (typeof help === 'string') {
                        registry[module$2] = { '*': help };
                        return;
                    }
                    if (Array.isArray(help)) {
                        registry[module$2] = { '*': help };
                        return;
                    }
                    if (typeof help === 'object') {
                        Object.keys(help).forEach(function (key) {
                            if (key === '*') {
                                registry[module$2] = help['*'];
                            }
                            registry[key] = help[key];
                        });
                        return;
                    }
                    throw new TypeError(format('Help property for module %s is invalid.', module$2));
                },
                commands: function (module$2, commands) {
                    if (!Array.isArray(commands)) {
                        throw new TypeError(format('Commands property for module %s is invalid.', module$2));
                    }
                    commands.forEach(function (command) {
                        if (typeof command !== 'string') {
                            throw new TypeError(format('Commands property for module %s is invalid.', module$2));
                        }
                        commandset.add(command);
                    });
                }
            },
            help: {
                help: [
                    '!help <query>',
                    ' ',
                    'Display the help message for the topic located at the given query.',
                    'Query can be made of multiple subtopics',
                    'Without a query, shows this help message.',
                    '',
                    'Ex: !help commands',
                    'Ex: !help uno start'
                ],
                commands: [
                    '!commands',
                    ' ',
                    'Show the list of commands.'
                ]
            },
            commands: [
                'help',
                'commands'
            ]
        };
    }
};