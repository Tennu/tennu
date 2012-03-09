var command = function (event, msg) {
  this.messenger = event.actor;
  this.params = msg.split(' ');
  console.log("PARAMS before: " + this.params);
  this.channel = event.channel;
  this.name = this.params.shift().toLowerCase();
  this.isQuery = event.isQuery;
}

command.prototype = {
  type: "command"
}

module.exports = command;