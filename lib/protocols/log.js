var protocol = require('protocols').protocol
var Log;

module.exports = Log = protocol({  
  /**
   * @param protocol Implementing object of protocol
   * @param String Message to log at default logging level.
   */
  log : [ protocol, String ],
  
  /**
   * @param protocol Implementing object of protocol
   * @param String Event emitted.
   */
  event : [ protocol, String ],
  
  /**
   * @param protocol Implementing object of protocol
   * @param String Incoming message.
   */
  input : [ protocol, String ],
  
  /**
   * @param protocol Implementing object of protocol
   * @param String Outgoing message.
   */
  output : [ protocol, String ],
});

// Default implementation is to not log anything.
Log(Object, {
  log : function () {},
  event : function () {},
  input : function () {},
  output : function () {}
});
