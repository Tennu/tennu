/**
 *
 * Command Handlers parse incoming messages and emit commands for valid
 * command messages. Valid commands are any of the following:
 *
 * 1. Starts with the trigger character.
 * 2. Starts with the receiver's name as determined by the name function.
 * 3. Is a private message.
 *
 * The constructor takes two arguments:
 *   1. A no-arg function that returns the name of the receiver
 *   2. Trigger configuration: Either a one character string or an object with
 *      a property trigger which has a one character string.
 */

/*
This needs a unit test suite. But since its only job is to implement an
interface, maybe I can find an interface test suite?
*/

var events = require('events');
var util = require('util');

var Command = require('./structures/command');

var CommandParser = function (name, config) {
    events.EventEmitter.call(this);
    var that = this;
    this._name = name;

    switch (typeof config) {
        case "string":
        this.trigger = config;
        break;
        case "object":
        this.trigger = (typeof config.trigger === "string" ?
            config.trigger : '!');

        break;
        default:
        this.trigger = '!';
    }
    this.trigger = config.trigger || "!";
};

CommandParser.prototype = new events.EventEmitter();
CommandParser.prototype.constructor = CommandParser;

CommandParser.prototype.parse = function (msg) {
    var command = this.getCommandString(msg);

    if (command) {
        command = Object.freeze(new Command(msg.actor, command,
            msg. channel, msg.isQuery));
        this.emit(command.name, command);
    }
};

// Returns the command string with the name and trigger removed or false.
CommandParser.prototype.getCommandString = function (privmsg) {
    if (privmsg.message.indexOf(this._name()) === 0) {
        var msg = privmsg.message.substr(privmsg.message.indexOf(" ") + 1);

        if (msg[0] === this.trigger[0]) {
            return msg.substr(1);
        } else {
            return msg;
        }
    }

    if (privmsg.message[0] === this.trigger[0]) {
        return privmsg.message.substr(1);
    }

    if (privmsg.isQuery) {
        return privmsg.message;
    }

    return false;
};

module.exports = CommandParser;
