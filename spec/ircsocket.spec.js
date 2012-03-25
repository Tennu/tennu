/**
 * @author havvy
 * This document does not respect the 80 char length limit.
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
    socket = new IRCSocket(network, function emptyHandler () {}, {
      socket : mocksocket
    });

    expect(socket.isConnected()).toBeFalsy();
  });
  
  it('can connect to a network', function () {
    socket.onConnect(function () {
      expect(this.isConnected()).toBeTruthy();
    });
    
    socket.connect();
    
    waits(100);
  });
  
  it('can then disconnect', function () {
    socket.onDisconnect(function () {
      expect(this.isConnected()).toBeFalsy();
    });
    
    setTimeout(function () {
      socket.disconnect();
    }, 150);
    
    waits(300);
  });
  
  it('declares NICK and USER to the server on connection', function () {
    runs(function () {
      mocksocket = new MockSocket();
      spyOn(mocksocket, 'write');
      socket = new IRCSocket(network, function emptyHandler () {}, {
        socket : mocksocket
      });
      socket.connect();
    });
    
    waits(1200);
    
    runs(function () {
      socket.disconnect();
      expect(mocksocket.write).toHaveBeenCalledWith('NICK testbot\n', 'ascii');
      expect(mocksocket.write).toHaveBeenCalledWith('USER testuser 8 * :' + //-
        socket.getRealName() + '\n', 'ascii');
    });
  });
});

describe('maintaining connection to a server', function () {
  it('responds to pings', function () {
    runs(function () {
      mocksocket = new MockSocket();
      spyOn(mocksocket, 'write');
      socket = new IRCSocket(network, function emptyHandler () {}, {
        socket : mocksocket
      });
      socket.connect();
    });
    
    waits(1200);  
    
    runs(function () {  
      expect(mocksocket.write).toHaveBeenCalledWith('PONG :PINGMESSAGE\n', 'ascii');
    });
  });
});
