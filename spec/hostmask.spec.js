/**
 * @author havvy
 * This document does not respect the 80 char length limit.
 */

var Hostmask = require('../lib/structures/hostmask');
var stringHostmaskOfSender = "sender!friendly@test.suite.net";
var stringHostmaskOfMiddleman = "middleman!malicious@test.suite.evil.net";

describe('requiring files', function requiringFiles () {
  it('is a constructor', function itIsAConstructor () {
    expect(typeof Hostmask).toEqual('function');
  });
});

describe('creating hostmasks', function creatingHostmasks () {
  it('returns a null hostmask when given no input', function returnsANullHostmaskWhenGivenNoInput () {
    var nullHostmask = new Hostmask();
    expect(nullHostmask).toBeDefined();
    expect(nullHostmask.nick).toEqual('');
    expect(nullHostmask.user).toEqual('');
    expect(nullHostmask.host).toEqual('');
  });
  
  it('breaks a hostmask into nick, user, and host', function breaksAHostmaskIntoNickUserAndHost () {
    var hostmaskOfSender = new Hostmask(stringHostmaskOfSender);
    expect(hostmaskOfSender).toBeDefined();
    expect(hostmaskOfSender.nick).toEqual('sender');
    expect(hostmaskOfSender.user).toEqual('friendly');
    expect(hostmaskOfSender.host).toEqual('test.suite.net');
  });
});

describe('the immutability of hostmasks', function theImmutabilityOfHostmasks () {
  it('cannot have values change', function cannotHaveValuesChange () {
    var hostmaskOfSender = new Hostmask(stringHostmaskOfSender);
    
    hostmaskOfSender.nick = 'middleman';
    expect(hostmaskOfSender.nick).toEqual('sender');
    
    hostmaskOfSender.user = 'malicous';
    expect(hostmaskOfSender.user).toEqual('friendly');
    
    hostmaskOfSender.host = 'test.suite.evil.net';
    expect(hostmaskOfSender.host).toEqual('test.suite.net');
  });
});

describe('standard interfaces', function standardInterfaces() {
  it('supports value equality', function itSupportsValueEquality() {
    var hostmaskOfSender_1 = new Hostmask(stringHostmaskOfSender);
    var hostmaskOfSender_2 = new Hostmask(stringHostmaskOfSender);
    
    expect(hostmaskOfSender_1.equals(hostmaskOfSender_2)).toBeTruthy();
  });

  it('is idempotent for String->Hostmask->String', function isIdempotentWithString () {
    expect((new Hostmask(stringHostmaskOfSender)).toString()).toEqual(stringHostmaskOfSender);
  });
});
