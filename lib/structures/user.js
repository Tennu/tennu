var User = function (uname) {
  this.name = uname;
  this.channels = {};
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

module.exports = User;