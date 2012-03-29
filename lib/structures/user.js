/**
 * @author havvy
 * A user represents a user on an IRC server.
 * 
 * @param {String} name Nickname of user.
 * @param {Channel} channel Channel first spotted in. Optional.
 */
var User = function (name, channel) {
  this.name = name;
  this.channels = {};
  
  if (channel) {
    this.addChannel(channel);
  }
};

User.prototype.addChannel = function (channel) {
  this.channels[channel.name] = channel;
  return this;
};

User.prototype.removeChannel = function (cname) {
    delete this.channels[cname];
};

User.prototype.remove = function (irc) {
  var channels = irc.getChannels();
  for (var cname in channels) {
    if (channels.hasOwnProperty(cname)) {
      channels[cname].removeUser(this.name);
      delete this.channels[cname];
    }
  }

  return true;
}

User.prototype.rename = function (newName) {
  var old = this.name;
  this.name = newName;

  for (var cname in this.channels) {
    if (this.channels.hasOwnProperty(cname)) {
      this.channels[cname].removeUser(old).addUser(this.name);
    }
  }
};

User.prototype.getNick = function () {
  return this.name;
};

module.exports = User;