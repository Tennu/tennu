/*
The MockSocket mocks a net.socket. The IRC socket is the socket type found
in nrc. socket is a variable to hold the IRCSocket. mocksocket is a variable
for holding mock sockets.
  */

var MockSocket = require('./mocksocket');
var IRCSocket = require('../lib/socket.js');

var network = Object.freeze({
  nick : 'testbot',
  user : 'testuser',
  server : 'irc.test.net',
  realname: 'realbot'
});

var closure = function (value) {
  return function () {
    return value;
  };
};

describe("connecting to a network", function connectingToANetwork () {
  var mocksocket, socket;

  it('knows whether or not it is connected.', function () {
    socket = new IRCSocket(network, {Socket : MockSocket});

    expect(socket.isConnected()).toBeFalsy();
  });

  it('can connect to a network', function () {
    socket.connect();
    expect(socket.isConnected()).toBeTruthy();
  });

  it('can then disconnect', function () {
    socket.end();
    expect(socket.isConnected()).toBeFalsy();
  });

  it('declares NICK and USER to the server on connection', function () {
    var mocksocket = new MockSocket();
    socket = new IRCSocket(network, {Socket : closure(mocksocket)});
    socket.connect();
    socket.end();
    expect(mocksocket.write).toHaveBeenCalledWith('NICK testbot\n', 'ascii');
    expect(mocksocket.write).toHaveBeenCalledWith('USER testuser 8 * :' + //-
      'realbot\n', 'ascii');
  });

  it('declares when ready to send commands', function () {
    var readyIsCalled = false;
    runs(function () {
      socket = new IRCSocket(network, {Socket : MockSocket});
      socket.on('ready', function () {
        readyIsCalled = true;
      });
      socket.connect();
    });

    waitsFor(function () {
      return readyIsCalled;
    }, "ready is emitted", 300);

    runs(function () {
      socket.end();
      expect(readyIsCalled).toBeTruthy();
    });
  });
});

describe('maintaining connection to a server', function () {
  var mocksocket, socket;

  beforeEach(function () {
    mocksocket = new MockSocket();
    socket = new IRCSocket(network, {Socket : closure(mocksocket)});
  });

  afterEach(function () {
    socket.end();
  });

  it('responds to pings', function () {
    runs(function () {
      socket.connect();
    });

    waitsFor(function () {
      return mocksocket.isConnected;
    }, "socket to connect", 400);

    runs(function () {
      expect(mocksocket.write).toHaveBeenCalledWith('PONG :PINGMESSAGE\n', 'ascii');
    });
  });

  it("emits each IRC line in a 'data' event", function () {
    var spy = jasmine.createSpy();
    runs(function () {
      socket.on('data', spy);
      socket.connect();
    });

    waitsFor(function () {
      return mocksocket.isConnected;
    }, "socket to connect", 400);

    runs(function () {
      expect(spy).toHaveBeenCalledWith(':irc.test.net 001 testbot :Welcome to the Test IRC Network testbot!testuser@localhost');
    });
  });
});
