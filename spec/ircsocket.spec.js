/**
 * @author havvy
 * This document does not respect the 80 char length limit.
 * Waits total: 1.1 seconds. :(
 *  Wanted:  Less than 0.2 seconds.
 */

/*
 * The MockSocket mocks a net.socket. The IRC socket is the socket type found
 * in nrc. socket is a variable to hold the IRCSocket. mocksocket is a variable
 * for holding mock sockets.
 */
var MockSocket = require('./mocksocket');
var IRCSocket = require('../lib/socket.js');
var socket, mocksocket;
var network = Object.freeze({
  nick : 'testbot',
  user : 'testuser',
  server : 'irc.test.net',
});

describe("connecting to a network", function connectingToANetwork () {
  it('knows whether or not it is connected.', function () {
    mocksocket = new MockSocket();
    socket = new IRCSocket(network, {socket : mocksocket});

    expect(socket.isConnected()).toBeFalsy();
  });
  
  it('can connect to a network', function () {    
    socket.connect();
    expect(socket.isConnected()).toBeTruthy();
  });
  
  it('can then disconnect', function () {    
    socket.disconnect();
    expect(socket.isConnected()).toBeFalsy();
  });
  
  it('declares NICK and USER to the server on connection', function () {
    mocksocket = new MockSocket();
    spyOn(mocksocket, 'write');
    socket = new IRCSocket(network, {socket : mocksocket});
    socket.connect();
    socket.disconnect();
    expect(mocksocket.write).toHaveBeenCalledWith('NICK testbot\n', 'ascii');
    expect(mocksocket.write).toHaveBeenCalledWith('USER testuser 8 * :' + //-
      socket.getRealName() + '\n', 'ascii');
  });
  
  it('declares when ready to send commands', function () {
    var readyIsCalled = false;
    runs(function () {
      mocksocket = new MockSocket();
      socket = new IRCSocket(network, {socket : mocksocket});
      socket.on('ready', function () {
        readyIsCalled = true;
      });
      socket.connect();
    });
      
    waits(300);
    
    runs(function () {
      socket.disconnect();
      expect(readyIsCalled).toBeTruthy();
    });
  });
});

describe('maintaining connection to a server', function () {
  it('responds to pings', function () {
    runs(function () {
      mocksocket = new MockSocket();
      spyOn(mocksocket, 'write');
      socket = new IRCSocket(network, {socket : mocksocket});
      socket.connect();
    });
    
    waits(400);  
    
    runs(function () {  
      expect(mocksocket.write).toHaveBeenCalledWith('PONG :PINGMESSAGE\n', 'ascii');
    });
  });
  
  it("emits each IRC line in a 'data' event", function () {
    var handler = {handler : function () {}};
    runs(function () {
      mocksocket = new MockSocket();
      socket = new IRCSocket(network, {socket : mocksocket});
      spyOn(handler, 'handler');
      socket.on('data', handler.handler)
      socket.connect();
    });
    
    waits(400);
    
    runs(function () {
      socket.disconnect();
      expect(handler.handler).toHaveBeenCalledWith(':irc.test.net 001 testbot :Welcome to the Test IRC Network testbot!testuser@localhost');
    });
  })
});
