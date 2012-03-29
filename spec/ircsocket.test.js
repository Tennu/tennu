var Socket = require('../lib/socket');
var winston = require('winston');
var Log = require('../lib/protocols/log')

var ioed = {
  levels: {
    debug: 0,
    event: 1,
    input: 2,
    output: 3
  },
  colors: {
    debug: 'red',
    event: 'green',
    input: 'cyan',
    output: 'yellow'
  }
};

Log(winston.Logger, {
  log : function (logger, message) {
    logger.log(message);
  },
  
  event : function (logger, message) {
    logger.event(message);
  },
  
  input : function (logger, message) {
    logger.input(message);
  },
  
  output : function (logger, message) {
    logger.output(message);
  }
});

var logger = new (winston.Logger)({ 
  levels: ioed.levels,
  transports : [new (winston.transports.Console)({colorize : true, level: 'debug'})]
});
winston.addColors(ioed.colors);

var network = {
  server : 'localhost',
  nick : 'testbot',
  user : 'testuser'
};

socket = new Socket(network, {logger:logger});
socket.connect();

setTimeout(function () {
  socket.disconnect();
}, 60000);
