/**
 * @author havvy
 * Waits Total: 1.1 seconds. :(
 */

var NRC = require('../lib/nrc');
var MockSocket = require('./mocksocket');

var network = Object.freeze({
  nick : 'testbot',
  user : 'testuser',
  server : 'irc.test.net',
});
var mocksocket;
var nrc;

describe('basics', function () {
  beforeEach(function () {
    mocksocket = new MockSocket();
    nrc = new NRC(network, {socket : mocksocket});
  });
  
  it('wraps an IRC socket', function () {
    nrc.connect();
    nrc.disconnect();
  });
  
  it('says when it is ready', function () {
    var handler;
    runs(function () {
      handler = {handler : function () {}};
      spyOn(handler, 'handler');
      nrc.on('ready', handler.handler);
      nrc.connect();
    });
    
    waits(500);
    
    runs(function () {
      nrc.disconnect();
      expect(handler.handler).toHaveBeenCalled();
    })
  });
});

describe('the nrc api', function () {
  mocksocket = new MockSocket();
  nrc = new NRC(network, {socket : mocksocket});
  nrc.connect();
  
  beforeEach(function () {
    spyOn(mocksocket, "write").andCallFake(function (message) {
      switch (message) {
        case "JOIN #test\n":
          this.emit('data', ":testbot!testuser@localhost JOIN :#test\r\n:irc.localhost.net 353 testbot = #test :@testbot\r\n:irc.localhost.net 366 testbot #test :End of /NAMES list.");
          break;
        case "QUIT\n":
          this.emit('data', "ERROR :Closing Link: testbot[localhost] (Quit: testbot)");
        default:
          void 0;
      }
    });
  });
  
  waits(500);
  
  it('can join channels', function () {
    nrc.join("#test");    
    expect(mocksocket.write).toHaveBeenCalledWith("JOIN #test\n", 'ascii');
  });
  
  it('can send messages to channels', function () {
    nrc.say("#test", "It's over 9000!");    
    expect(mocksocket.write).toHaveBeenCalledWith("PRIVMSG #test :It's over 9000!\n", 'ascii');
  });
  
  it('can part channels with a reason', function () {
    nrc.part("#test", "Told to leave.");    
    expect(mocksocket.write).toHaveBeenCalledWith("PART #test :Told to leave.\n", 'ascii');
  });
  
  it('can part channels without a reason', function () {
    nrc.once('join', function (event) {
      nrc.part(event.channel);
    });
    nrc.join("#test");
    
    waits(100);
  
    expect(mocksocket.write).toHaveBeenCalledWith("PART #test\n", 'ascii');
  });
  
  it('can quit', function () {
    nrc.quit();
    
    expect(mocksocket.write).toHaveBeenCalledWith("QUIT\n", 'ascii');
  });
});

describe("listening to user commands", function () {
  mocksocket = new MockSocket();
  nrc = new NRC(network, {socket : mocksocket});
  nrc.connect();
  nrc.join("#test");
  
  it('emits user commands', function () {
    var on = {testcommand : function (event) {} };    
    spyOn(on, 'testcommand');
    
    nrc.getCommandEmitter().on("testcommand", on.testcommand);
    
    mocksocket.sendFakeMessage(":sender!user@localhost PRIVMSG #test :!testcommand")
    var util = require('util');
    expect(on.testcommand.callCount).toBe(1);
    
    mocksocket.sendFakeMessage(":sender!user@localhost PRIVMSG #test :testbot: testcommand");
    expect(on.testcommand.callCount).toBe(2);
    
    mocksocket.sendFakeMessage(":sender!user@localhost PRIVMSG testbot :testcommand");
    expect(on.testcommand.callCount).toBe(3);
  });
})
