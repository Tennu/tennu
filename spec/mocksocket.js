var EE = require('events').EventEmitter;

var Socket = function () {
  this.ee = new EE();
};

Socket.prototype = {
  connect : function () {
    this.ee.emit("connect");
    setTimeout((function () {
      this.ee.emit("data", 'PING :PINGMESSAGE\r\n');
    }).bind(this), 1000);
  },
  
  end : function () {
    this.ee.emit("close")
  },
  
  write : function () {
    void 0;
  },
  
  setNoDelay : function () {
    void 0;
  },
  
  setEncoding : function () {
    void 0;
  },
  
  once : function (name, handler) {
    this.ee.once(name, handler);
  },
  
  on : function (name, handler) {
    this.ee.on(name, handler);
  },
  
  off : function (name, handler) {
    this.ee.off(name, handler);
  },
}

module.exports = Socket;