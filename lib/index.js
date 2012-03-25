var net = require('net');
var events = require('events');
var Server = require('./server');
var User = require('./structures/user');
var Channel = require('./structures/channel');
var Message = require('./structures/message');
var Command = require('./structures/command');
var util = require('util');

/**
 * Connects to a specified network, starting the socket at {@link socket},
 * sets nickname and username fields (modify the first setTimeout to modify the
 * username values), possibly identifies to nickserv, and joins default channels.
 *
 * Uses ASCII encoding.
 * @public
 * @constructor
 * @param {number} [port=6667] Port to connect to.
 * @param {string} server Server to connect to.
 * @param {Object} network Object containing following values.
 * @param {string} network.nick Initial nickname to try to use.
 * @param {string} [network.nickserv="Nickserv"] Name of nickserv service.
 * @param {string} [network.password] Nickserv password to use, if nickname is registered.
 * @param {string} [network.trigger="!"] Default trigger to use.
 * @public
 * @return {function} a "raw" function to communicate with the server with.
 */
var IRC = function (network, logging) {
  var that = this;

  this.s = new Server(network.server);
  this.nick = network.nick;
  this.user = '';
  this.host = '';
  this.self = this.users[this.nick] = new User(this.nick);
  this.statusmsg = []; // For usage with raw 005
  this.trigger = network.trigger || '!';
  this.server = network.server;
  this.logging = logging;

  var ircEventEmitter = new events.EventEmitter();
  var commander = new events.EventEmitter();
  var socket;

  /**
   * BNF Handler of IRC messages as per
   * http://www.irchelp.org/irchelp/rfc/chapter2.html#c2_3a
   *
   * @param {string} raw Message sent from an IRC server.
   * @fires 001..999, join, part, quit, error, privmsg, mode, notice
   * @fires arbitrary commands
   */
  var handle = function (raw) {
    if (raw.length === 0) {
      return null;
    }

    this.log(raw);

    // Parse the raw message, getting an event object. Disallow modification.
    var event = Object.freeze(new Message(raw, this));

    // Emit the event.
    this.log(event.name);
    ircEventEmitter.emit(event.name, event);

    // Emit a command event if there is one.
    if (event.name === "privmsg") {
      var command;
      if (event.isQuery) {
        command = new Command(event, event.message);
      } else if (event.message[0] === this.trigger[0]) {
        command = new Command(event, event.message.substr(1));
      } else if (event.message.indexOf(this.nick) === 0) {
        command = new Command(event, event.message.substr(event.message.indexOf(" ") + 1));
      }

      if (command) {
        Object.freeze(command);
        this.log("Command: " + command.name);
        commander.emit(command.name, command);
      }
    }
  }.bind(this);

  /**
   * Bridge for the ircEventEmitter
   * Takes a map of events to handlers or seperately an event name and its handler.
   */
  this.on = function (event, callback) {
    if (arguments.length === 1) {
      for (var name in event) {
        if (event.hasOwnProperty(name)) {
          if (!(typeof event[name] === "function")) {
            throw new Error("Event handler must be a function.");
          }
          this.log("Listener added for event:   " + name);
          ircEventEmitter.on(name, event[name].bind(this));
        }
      }

      return;
    }

    if (typeof event === "string" && typeof callback === "function") {
      this.log("Listener added for event: " + event);
      ircEventEmitter.on(event, callback.bind(this));
      return;
    }

    throw new Error("Wrong paramters for listening.");
  };

  /**
   * Bridge for removing listeners from ircEventEmitter
   */
  this.off = function (event, callback) {
    ircEventEmitter.removeListener(event, callback);
  };

  /**
   * Bridge to add listeners for commands.
   */
  this.when = function (event, callback) {
    if (arguments.length === 1) {
      for (var name in arguments[0]) {
        if (event.hasOwnProperty(name)) {
          if (!(typeof event[name] === "function")) {
            throw new Error("Event handler must be a function.");
          }

          this.log("Listener added for command: " + name);
          commander.on(name, event[name].bind(this));
        }
      }

      return;
    }

    if (typeof event === "string" && typeof callback === "function") {
      this.log("Listener added for command: " + event);
      commander.on(event, callback.bind(this));
      return;
    }

    throw new Error("Wrong parameters for listening.");
  };

  this.whenNot = function (event, callback) {
    eventer.removeListener(event, callback);
  };

  //Add default event handlers.
  this.on(require('./handlers'));
};

IRC.prototype = {

  /**
   * Quits from server.
   *
   * @public
   * @param {string} [reason="No reason given."] Reason that others see when the bot quits.
   */
  quit : function (reason) {
    this.raw("QUIT :" + (reason || "No reason given."));
  },

  /**
   * Sends a message to target using PRIVMSG.
   * @public
   * @param {string} target Either a channel or nickname to send the message to.
   * @param {string} msg Message to be sent.
   */
  msg : function (target, msg) {
    if (arguments.length !== 2) {
      throw new Error("msg method takes two parameters.");
    }

    this.raw("PRIVMSG " + target + " :" + msg);
  },

  mode : function (target, change) {
    if (arguments.length !== 2) {
      throw new Error("msg method takes two parameters.");
    }

    this.raw("MODE " + target + " :" + change);
  },

  /**
   * Joins a channel.
   *
   * @public
   * @param {string} chan Channel must be a valid channel string. For example, "#havvy" or "#havvy,#pi" or "#havvy key".
   */
  join : function (chan) {
    if (!this.channels[chan]) {
      this.raw("JOIN " + chan);
    }
  },

  /**
   * Parts specified channel.
   * @public
   * @param {string} chan Channel currently connected to.
   */
  part : function (chan) {
    if (this.channels[chan]) {
      this.raw("PART " + chan);
    }
  },

  /**
   * Gets whois data about a user. Does not collect the data, but the data
   * is sent through raws, so they can be collected that way.
   * @public
   * @param {string} user User to get whois info about.
   */
  whois : function (user) {
    this.raw("WHOIS " + user);
  },

  /**
   * Changes the character that heartless is listening for to execute commands.
   * Only uses the first character.
   * @public
   * @param {string} trigger Character to listen with.
   */
  noconflict : function (trigger) {
    this.trigger = trigger[0];
  },

  log : function (msg) {
    if (this.logging) {
      console.log(msg);
    }
  }
};

/** @namespace */
IRC.parse = require('./parsers');

module.exports = IRC;