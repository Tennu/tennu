var Channel = function (cname) {
  this.name = cname;
  this.users = {};
};

Channel.prototype.addUser = function (user) {
    this.users[user.name] = user;
    return this;
}

Channel.prototype.removeUser = function (uname) {
  delete this.users[uname];
  return this;
};

Channel.prototype.remove = function (irc) {
  var users = irc.getUsers();
  for (var uname in users) {
    if (users.hasOwnProperty(uname)) {
      users[uname].removeChannel(this.name);
      delete this.users[uname];
    }
  }

  this.channels = {};

  return true;
};

module.exports = Channel;