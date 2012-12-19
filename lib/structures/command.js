/**
 * @author havvy
 * @valueObject
 */

var command = function (sender, msg, channel, isQuery) {
  this.sender = sender;
  this.params = msg.split(' ');
  this.channel = channel;
  this.name = this.params.shift().toLowerCase();
  this.isQuery = isQuery || false;
};

module.exports = command;

