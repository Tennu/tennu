var parse = require('./parsers');
var User = require('./structures/user');
var Channel = require('./structures/channel');

module.exports = {
  "ping" : function defaultPingHandler(e) {
    this.raw('PONG :' + e.params[0]);
  },

  "nick" : function defaultNickHandler(e) {
    if (e.actor === this.nick) {
      this.nick = e.params[0];
    }

    this.changeUname(e.actor, e.newNick);
  },

  "mode" : function defaultModeHandler(e) {
    if (e.actor === this.nick) {
      var modeChanges = parse.mode(e.params[1]);
      for (mode in modeChanges) {
        if (modeChanges.hasOwnProperty(mode)) {
          if (modeChanges[mode].sign === "+") {
            this.self.modes[mode] = modeChanges[mode];
          } else {
            delete this.self.modes[mode];
          }
        }
      }
    }
  },

  "001" : function default001Handler(e) {
    var hostmask = e.params.pop().split(" ").pop();
    this.hostmask = hostmask;
    this.nick = parse.hostmask(hostmask, "nick");
    this.user = parse.hostmask(hostmask, "user");
    this.host = parse.hostmask(hostmask, "host");
  },

  "005" : function default005Handler(e) {
    var ix, jx;

    // Look for STATUSMSG and put it's values into this.statusmsg.
    for (ix = 0; ix < e.params.length; ix++) {
      if (e.params[ix].indexOf("STATUSMSG") === 0) {
        for (jx = 9; jx < e.params[ix].length; jx++) {
          this.statusmsg.push(e.params[ix][jx]);
        }
      }
    }
    console.log(this.statusmsg);
  }
};