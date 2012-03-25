var User = require('./structures/user');
var Channel = require('./structures/channel');

/**
 * @author havvy
 * 
 * A server contains the data of the server, specifically the channels that the
 * bot is connected to along with the users whom are also in the channel.
 */

var Server = function (irc, name) {
  var self = this;
  
  this.name = name;
  this.channels = [];
  this.users = [];
  this.self = new User(irc.nick);
  
  irc.on('part', function serverPartHandler(e) {
    if (e.actor === self.self.name) {
      // I parted.
      self.removeChannel(e.channel);
    } else {
      // Somebody else parted.
      self.removeUserFrom(e.actor, e.channel);
    }
  });
  
  irc.on('quit', function serverQuitHandler(e) {
    if (e.actor === self.self.name) {
      for (channel in self.channels) {
        if (self.channels.hasOwnProperty(channel)) {
          self.channels[channel].remove();
        }
      }
      delete self.users;
      delete self.channels;
      delete self.self;
    } else {
      self.removeUser(e.actor);
    }
  });
  
  irc.on("353", function server353Handler(e) {
    this.log("unames", e.users);
    
    var unames = e.users;

    for (ix = 0; ix < unames.length; ix++) {
      // Strip mode characters.
      // TODO Create REGEX for this.
      for (jx = 0; jx < this.statusmsg.length; jx++) {
        if (unames[ix][0] === this.statusmsg[jx]) {
          unames[ix] = unames[ix].slice(1);
        }
      }

      if (!self.getUser(unames[ix])) {
        self.users[unames[ix]] = new User(unames[ix]);
      }

      self.getChannel(e.channel).addUser(self.getUser(unames[ix]));
      self.getUser(unames[ix]).addChannel(self.getChannel(e.channel));
    }
  });

  irc.on("join", function serverJoinHandler(e) {
    var ix, jx;
    this.log(e.actor + " " + self.nick);
    if (e.actor === self.nick) {
      // I joined.
      new Channel(e.channel, self);
    } else {
      // Somebody else joined.
      if (!self.users[e.actor]) {
        self.users[e.actor] = new User(e.actor);
      }

      self.getUser(e.actor).addChannel(self.getChannel(e.channel));
      self.getChannel(e.channel).addUser(self.getUser(e.actor));
    }
  });
}

Server.prototype = {
  /**
   * Removes the knowledge of a channel from the bot.  Useful for when the bot
   * is parting a channel.
   * @return Whether or not a channel is removed.
   */
  removeChannel : function (chan) {
    var channel = this.channels[chan];

    if (!channel) {
      return false;
    }

    for (var ix = 0; ix < channel.users.length; ix++) {
      // Remove channel from the channels property of each user.
      channel.users[ix].removeChannel(chan);

      // If user not in any other channels as bot, remove user
      // from knowledge, since I cannot detect when that user quits.
      if (channel.users[ix].channels.length === 0) {
        this.removeUser(channel.users[ix].nick);
      }
    }

    delete this.channels[chan];
    return true;
  },

  /**
   * Removes the knowledge of a user from the bot. Useful for when a user quits
   * or parts all channels the bot is in.
   * @param {String} uname Nickname of user
   */
  removeUser : function (uname) {
    var user = this.getUser(uname);

    if (!user) {
      return false;
    }

    user.remove(this);

    delete this.users[uname];
    return true;
  },

  removeUserFrom : function (uname, cname) {
    var user = this.getUser(uname);
    var channel = this.getChannel(cname);

    channel.removeUser(uname);
    user.removeChannel(cname);

    if (Object.keys(user.channels).length === 0) {
      this.removeUser(uname);
    }

    return true;
  },

  changeUname : function (orig, curr) {
    this.users[curr] = this.users[orig];
    delete this.users[orig];

    this.users[curr].rename(curr);
  },

  getChannel : function (cname) {
    return this.channels[cname];
  },

  getUser : function (uname) {
    return this.users[uname];
  },

  getChannels : function () {
    return this.channels;
  },

  getUsers : function () {
    return this.users();
  }
}

module.exports = Server;
