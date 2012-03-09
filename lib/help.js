module.exports = {
  "C-HELP" : function (e) {
    var n = e.messenger, m = this.msg;

    m(n, "Commands by module:");
    m(n, "AUTH: auth, register, group");
    m(n, "INTROSPECTION: channel, user");
    m(n, "FUN: sammich, poem");
    m(n, "ROOT: noConflict, quit, join, part");
    m(n, "DND: roll, dnd, 3.5e, srd, pub");
    m(n, "HELP: help");
  }
};