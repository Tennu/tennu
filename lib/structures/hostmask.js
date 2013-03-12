/**
 * A hostmask is the combination of a nickname, a username, and a host. 
 * Every IRC user has one that can be obtained from the USERHOST message.
 *
 * This object is frozen upon creation.
 *
 * Constructor: Takes one argument, a hostmask. For example "nick!user@host";
 */

/*
*/

var Hostmask = function (asString) {
    var nickEnd = asString.indexOf("!");
    var userEnd = asString.indexOf("@");

    this.nick = asString.slice(0, nickEnd);
    this.user = asString.slice(nickEnd + 1, userEnd);
    this.host = asString.slice(userEnd + 1);

    Object.freeze(this);
};

Hostmask.prototype.equals = function (that) {
    return this.nick === that.nick && this.user === that.user &&
        this.host === that.host;
};

Hostmask.prototype.toString = function () {
    return this.nick + '!' + this.user + '@' + this.host;
};

module.exports = Hostmask;