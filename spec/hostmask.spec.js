var Hostmask = require('../lib/structures/hostmask');
var sampleHostmask = "sender!friendly@test.suite.net";
var differentHostmask = "havvy!kvirc@mib-6AB72C.wa.qwest.net";

describe("Hostmasks", function () {
  it('break a hostmask into nick, user, and host', function () {
    var hm = new Hostmask(sampleHostmask);

    expect(hm.nick).toEqual('sender');
    expect(hm.user).toEqual('friendly');
    expect(hm.host).toEqual('test.suite.net');
  });

  it('are immutable', function () {
    var hm = new Hostmask(sampleHostmask);

    expect(Object.isFrozen(hm)).toBeTruthy();
  });

  it('support value equality', function () {
    var hm = new Hostmask(sampleHostmask);
    var same = new Hostmask(sampleHostmask);
    var diff = new Hostmask(differentHostmask);

    expect(hm.equals(same)).toBeTruthy();
    expect(hm.equals(diff)).not.toBeTruthy();
  });

  it('are idempotent for String->Hostmask->String', function () {
    expect(new Hostmask(sampleHostmask).toString()).toEqual(sampleHostmask);
    expect(new Hostmask(differentHostmask).toString()).toEqual(differentHostmask);
  });
});
