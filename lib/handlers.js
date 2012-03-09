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

  "353" : function default353Handler(e) {
    var unames = e.params.pop().trim().split(" ");
    var cname = e.params.pop();

    console.log("unames", unames);

    for (ix = 0; ix < unames.length; ix++) {
      // Strip mode characters.
      // TODO Create REGEX for this.
      for (jx = 0; jx < this.statusmsg.length; jx++) {
        if (unames[ix][0] === this.statusmsg[jx]) {
          unames[ix] = unames[ix].slice(1);
        }
      }

      if (!this.getUser(unames[ix])) {
        this.users[unames[ix]] = new User(unames[ix]);
      }

      this.getChannel(cname).addUser(this.getUser(unames[ix]));
      this.getUser(unames[ix]).addChannel(this.getChannel(cname));
    }
  },

  "join" : function defaultJoinHandler(e) {
    var ix, jx;
    this.log(e.actor + " " + this.nick);
    if (e.actor === this.nick) {
      // I joined.
      this.channels[e.channel] = new Channel(e.channel);
    } else {
      // Somebody else joined.
      if (!this.users[e.actor]) {
        this.users[e.actor] = new User(e.actor);
      }

      this.getUser(e.actor).addChannel(this.getChannel(e.channel));
      this.getChannel(e.channel).addUser(this.getUser(e.actor));
    }
  },

  "part" : function defaultPartHandler(e) {
    var uname = parse.hostmask(e.prefix, "nick");
    var cname = e.params.shift();

    if (uname === this.nick) {
      // I parted.
      this.removeChannel(cname);
    } else {
      // Somebody else parted.
      this.removeUserFrom(uname, cname);
    }
  },

  "quit" : function defaultQuitHandler(e) {
    this.removeUser(e.actor);
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