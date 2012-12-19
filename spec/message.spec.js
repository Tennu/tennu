/**
 * @author havvy
 * This document does not respect the 80 char length limit.
 */

var Message = require('../lib/structures/message');
var Hostmask = require('../lib/structures/hostmask');
var User = require('../lib/structures/user');
var self = new User('tbot');
var sender = "sender!malicious@test.suite.net";
var privmsg = [":" + sender, "PRIVMSG", "#channel :somebody said something"].join(' ');

describe('requiring files', function requiringFiles () {
  it('is a constructor', function itIsAConstructor () {
    expect(typeof Message).toEqual('function');
  });
});

describe('static methods', function staticMethods () {
  it('determines if a message has a prefix', function hasAPrefix () {
    expect(typeof Message.hasPrefix).toEqual('function');
    expect(Message.hasPrefix(privmsg)).toBeTruthy();
  });
  
  it('determines the type of prefixes', function typeOfPrefixes () {
    expect(typeof Message.getPrefixType).toEqual('function');
    expect(Message.getPrefixType('irc.mozilla.org')).toEqual('server');
    expect(Message.getPrefixType('sender')).toEqual('nick');
    expect(Message.getPrefixType(sender)).toEqual('hostmask');
  });
});

describe('creating event objects', function creatingEventObjects () {
  it('structurally stores an IRC message', function () {
    var message = new Message(privmsg, self);
    
    expect(message.sender.equals(new Hostmask(sender))).toBeTruthy();
    expect(message.receiver).toBe(self);
  });

  it('structurally stores the message type', function storeMessageType () {
    var message = new Message(privmsg, self);
    
    expect(message.type).toEqual("privmsg");
  });

  it('stores parameters, including multiword parameters', function () {
    var message = new Message(privmsg, self);
    
    expect(message.parameters.length).toBe(2);
    expect(message.parameters[0]).toEqual("#channel");
    expect(message.parameters[1]).toEqual("somebody said something");
  });
});

describe("privmsg", function () {
  it('knows when the privmsg is a query', function () {
    var message = new Message(":sender!user@localhost PRIVMSG tbot :testcommand", self);
    
    expect(message.type).toEqual("privmsg");
    expect(message.isQuery).toBeTruthy();
  });
});
