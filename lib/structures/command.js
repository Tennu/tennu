/**
 * @author havvy
 * @valueObject
 */

var command = function (sender, msg, channel, isQuery) {
  this.sender = sender;
  this.args = msg.split(' ');
  this.channel = channel;
  this.name = this.args.shift().toLowerCase();
  this.isQuery = isQuery || false;
};

module.exports = command;

