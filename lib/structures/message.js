/**
 *
 * An immutable structure for an IRC message.
 *
 */

var util = require('util');

var Hostmask = require('./hostmask');
var mircColors = /\u0003\d?\d?,?\d?\d?/g;

var Message = function (message, receiver) {
    var ixa = -1, ixb = -1;

    if (Message.hasSender(message)) {
        ixa = message.indexOf(" ");

        this.sender = message.slice(1, ixa);
        if (Message.getSenderType(this.sender) === "hostmask") {
            this.sender = new Hostmask(this.sender);
            this.nick = this.sender.nick;
            this.user = this.sender.user;
            this.host = this.sender.host;
        }
    }

    ixb = message.indexOf(" ", ixa + 1);

    this.name = message.slice(ixa + 1, ixb).toLowerCase();
    this.args = Message.parameterize(message.slice(ixb + 1));
    this.receiver = receiver;

    // Better than a bunch of unique constructors or calling an extra function.
    switch (this.name) {
        case "join":
        case "part":
        this.actor = this.sender.nick;
        this.channel = this.args[0].toLowerCase();
        break;
        case "privmsg":
        this.actor = this.sender.nick;
        if (this.args[0] === receiver.nick()) {
            this.isQuery = true;
            this.channel = this.actor;
        } else {
            this.isQuery = false;
            this.channel = this.args[0].toLowerCase();
        }
        this.message = this.args[1].trim().replace(mircColors, "");
        break;
        case "notice":
        this.actor = this.sender.nick;
        break;
        case "quit":
        this.actor = this.sender.nick;
        this.reason = this.args[0].toLowerCase();
        break;
        case "nick":
        this.actor = this.sender.nick;
        this.newNick = this.args[0];
        break;
        case "353":
        this.users = this.args[this.args.length - 1].trim().split(" ");
        this.channel = this.args[this.args.length - 2];
        break;
    }

    Object.freeze(this);
    Object.freeze(this.args);
};

Message.prototype.equals = function (that) {
    for (var key in this) {
        if (this[key] !== that[key]) {
            return false;
        }
    }

    return true;
};

Message.hasSender = function (message) {
    return message[0] === ":";
};

Message.getSenderType = function (prefix) {
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
        return "server";
    }

    return "nick";
};

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