/**
 * A hostmask is the combination of a nickname, a username, and a host. Every IRC user
 * has one that can be obtained from the WHOIS message.
 *
 * A hostmask's value properties (nick, user, and host) are guaranteed to be final.
 *
 * @author havvy
 * @param {String} asString String representation of a hostmask. nick!user@host
 */

nullHostmask = {
  nick : '',
  user : '',
  host : ''
};

var Hostmask = function (asString) {
  if (!asString) {
    return nullHostmask;
  }
  
  var nickEnd = asString.indexOf("!");
  var userEnd = asString.indexOf("@");
  
  var nick = asString.slice(0, nickEnd);
  var user = asString.slice(nickEnd + 1, userEnd);
  var host = asString.slice(userEnd + 1);
  
  Object.defineProperties(this, {
    "nick" : {
      "get" : function () { return nick; }
    },
    "user" : {
      "get" : function () { return user; }
    },
    "host" : {
      "get" : function () { return host; }
    }
  });
};

Hostmask.prototype = {
  equals : function (other) {
    return this.nick === other.nick && this.user === other.user &&
      this.host === other.host;
  },
  
  toString : function () {
    return [this.nick, '!', this.user, '@', this.host].join('');
  }
};

nullHostmask.prototype = Hostmask;
module.exports = Hostmask;