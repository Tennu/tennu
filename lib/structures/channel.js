/**
 * @constructor
 * @param {String} cname Name of channel.
 * @author havvy
 * An IRC Channel.
 */
var Channel = function (cname, user) {
  this.name = cname;
  this.users = {};
  
  this.addUser(user);
};

/**
 * @param {User} user User that is in the channel.
 */
Channel.prototype.addUser = function (user) {
    this.users[user.name] = user;
    return this;
};

/**
 * @param {String} uname Name of a user that is removed from the channel.
 */
Channel.prototype.removeUser = function (uname) {
  delete this.users[uname];
  return this;
};

/**
 * @param {Server} server
 */
Channel.prototype.remove = function (server) {
  var users = server.getUsers();
  for (var uname in users) {
    if (users.hasOwnProperty(uname)) {
      users[uname].removeChannel(this.name);
      delete this.users[uname];
    }
  }

  this.channels = {};

  return true;
};

/**
 * Untested!
 * @param {String} user
 * @returns Whether or not user is in channel.
 */
Channel.prototype.contains = function (user) {
  return !!this.users[user];
};

module.exports = Channel;