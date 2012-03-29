/**
 * @author havvy
 * 
 * Dependencies:  Hostmask, User<br>
 * <li>Hostmasks are found inside IRC messages, sometimes.
 * <li>IRC messages are sent to a specific User, the receiver of the message.
 */

var parsers = require('../parsers');
var Hostmask = require('./hostmask');
var mircColors = /\u0003\d?\d?,?\d?\d?/g;

/**
 * @param {String} message Message from IRC.
 * @param {User} receiver User receiving message.
 * @constructor
 */
var Message = function (message, receiver) {
  var ixa = -1, ixb = -1;
  
  this.receiver = receiver;

  if (Message.hasPrefix(message)) {
    ixa = message.indexOf(" ");
    this.prefix = message.slice(1, ixa);
    
    if (Message.getPrefixType(this.prefix) === "hostmask") {
      this.sender = new Hostmask(this.prefix);
    } else {
      this.sender = this.prefix;
    }
  }

  ixb = message.indexOf(" ", ixa + 1);

  this.type = this.name = message.slice(ixa + 1, ixb).toLowerCase();
  this.parameters = this.params = parsers.params(message.slice(ixb + 1));

  // Better than a bunch of unique constructors.
  switch (this.name) {
    case "join":
    case "part":
      this.actor = this.sender.nick;
      this.channel = this.params[0].toLowerCase();
      break;
    case "privmsg":
      this.actor = this.sender.nick;
      if (this.params[0] === receiver.getNick()) {
        this.isQuery = true;
        this.channel = this.actor;
      } else {
        this.isQuery = false;
        this.channel = this.params[0].toLowerCase();
      }
      this.message = this.params[1].trim().replace(mircColors, "")
      break;
    case "quit":
      this.actor = this.sender.nick;
      this.reason = this.params[0].toLowerCase();
      break;
    case "nick":
      this.actor = this.sender.nick;
      this.newNick = this.params[0].toLowerCase();
      break;
    case "353":
      this.users = this.params[this.params.length - 1].trim().split(" ");
      this.channel = this.params[this.params.length - 2];
    default:
      void 0;
  }
};

/**
 * @param {String} message IRC Message in textual format.
 * @return {boolean} whether or not the message has a prefix, as defined by the IRC RFCs.
 */
Message.hasPrefix = function (message) {
  return message[0] === ":";
};

/**
 * @param {string} prefix The part of a message between a : and the first
 * space if the first character is a colon.
 * @return {string} The prefix type, from ["server", "nick", "hostmask",
 * and "nick@host"].
 */
Message.getPrefixType = function (prefix) {
  var exclamation = /!/.test(prefix);
  var at = /@/.test(prefix);
  var dot = /\./.test(prefix);
  
  if (exclamation) {
    return "hostmask";
  }
  
  if (at && dot) {
    return "nick@host";
  }
  
  if (dot) {
    return "server"
  }
  
  return "nick";
};

/**
 * @param {string} params Everything after the first space of the command
 * @return {string[]} Parameters broken into an array, properly handling
 * the trailing case.
 */
Message.parameterize = function (params) {
  var trailing, middle, trailingIx;

  trailingIx = params.indexOf(" :");

  if (params[0] === ":") {
    return [params.slice(1)];
  } else if (trailingIx === -1) {
    return params.split(" ");
  } else {
    trailing = params.slice(trailingIx + 2).trim();
    middle = params.slice(0, trailingIx).split(" ");
    middle.push(trailing); //push returns the length property
    return middle;
  }
};


module.exports = Message;