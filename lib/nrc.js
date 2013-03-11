/**
 *
 * The public contract of the Client object is documented by readme.md.
 *
 * Public Methods:
 *   connect() -> void
 *   disconnect() -> void
 *   Configuration Storage iface
 *   IrcOutputSocket iface
 *   Bisubscriber iface
 *   Modules iface
 */

/*
I should see if there's a better way to make this class than
all of these wrapped methods.
*/

var defaultFactoryConfiguration = {
    'Socket' : require('net').Socket,
    'IrcSocket' : require('./socket'),
    'IrcOutputSocket' : require('./output-socket'),
    'MessageParser' : require('./message-parser'),
    // 'ChunkedMessageParser' : require('./chunked-message-parser'),
    'CommandParser' : require('./command-parser'),
    'Modules' : require('./modules'),
    'BiSubscriber' : require('./bisubscriber')
};

var defaultClientConfiguration = {
    channels: [],
    nickserv: "nickserv",
    password: undefined,
    nick: "nrcbot",
    user: "nrc",
    port: 6667,
    modules: [], // unimplemented
    realname: "nrc beta 0.3",
    trigger: '!'
};

var defaults = function (o, d) {
    var n = {};
    for (var key in d) {
        if (d.hasOwnProperty(key)) {
            if (o[key] === undefined) {
                n[key] = d[key];
            } else {
                n[key] = o[key];
            }
        }
    }
    return n;
};

/** Fields
 * _config
 * _socket
 * _outputSocket
 * _subscriber
 * _modules
 */
 var Client = function (config, di) {
    var that = this;

    // Parse the configuration object. Make it immutable.
    this._config = Object.freeze(defaults(config, defaultClientConfiguration));
    di = defaults(di, defaultFactoryConfiguration);

    // Create a socket.
    // The socket reads and sends messages from/to the IRC server.
    // The output socket wraps the `raw` method.
    this._socket = new di.IrcSocket(this._config, di);
    this._outputSocket = new di.IrcOutputSocket(this._socket, config.nick);

    // Find a new place for this.
    // Maybe as part of the IrcSocket refactored for accepting a
    // startup sequence.
    this._socket.on('ready', function () {
        if (that._config.password) {
            that.say(that._config.nickserv, "identify " + that._config.password);
        }

        that._config.channels.forEach(function (channel) {
            this.join(channel);
        }.bind(that));
    });

    // Create the listener to the socket.
    // This listener will parse the raw messages of the socket, and
    // emits specific events to listen to.
    var messageParser = new di.MessageParser(this, this._socket);

    // Create the listener to private messages from the IRCMessageEmitter
    // The commander will parse these private messages for commands, and
    // emit those commands, also parsed.
    var commandParser = new di.CommandParser(this.nick.bind(this), this._config);

    // The subscriber handles event subscriptions to the Client object,
    // determining whether they should be handled by the IrcMessageEmitter
    // or the Command Parser.
    this._subscriber = new di.BiSubscriber(messageParser, commandParser);
    this._subscriber.on("privmsg", commandParser.parseMessage.bind(commandParser));

    // And finally, the module system.
    this._modules = new di.Modules(this._subscriber);
    this.require(require("../modules/server"));
    //this.require(require("../modules/help"));
    //this.require(require("../modules/user"));
    //this.require(require("../modules/channel"));

    // Standard event for IRC quitting.
    this._subscriber.on("error", function (event) {
        that.disconnect();
    });
};

// implements ConfigurationStorage

Client.prototype.config = function (param) {
    return this._config[param];
};

// implements ???

Client.prototype.connect = function () {
    this._socket.connect();
    return this;
};

Client.prototype.start = function () {
    this._socket.connect();
    return this;
};

Client.prototype.disconnect = function () {
    this._socket.end();
    return this;
};

Client.prototype.end = function () {
    this._socket.end();
    return this;
};

// implements IRC Output Socket

Client.prototype.say = function () {
    this._outputSocket.say.apply(this._outputSocket, arguments);
    return this;
};

Client.prototype.act = function() {
    this._outputSocket.act.apply(this._outputSocket, arguments);
    return this;
};

Client.prototype.join = function () {
    this._outputSocket.join.apply(this._outputSocket, arguments);
    return this;
};

Client.prototype.part = function () {
    this._outputSocket.part.apply(this._outputSocket, arguments);

    return this;
};

Client.prototype.quit = function () {
    this._outputSocket.quit.apply(this._outputSocket, arguments);
    return this;
};

Client.prototype.nick = function () {
    var nick = this._outputSocket.nick.apply(this._outputSocket, arguments);
    return nick || this;
};

Client.prototype.userhost = function () {
    this._outputSocket.userhost.apply(this._outputSocket, arguments);
};

Client.prototype.whois = function () {
    this._outputSocket.whois.apply(this._outputSocket, arguments);
};

// implements BiSubscriber

Client.prototype.on = function (a1, a2) {
    this._subscriber.on(a1, a2);
    return this;
};

Client.prototype.once = function (a1, a2) {
    this._subscriber.once(a1, a2);
    return this;
};

// implements ModuleSubscriber

Client.prototype.require = function (module) {
    return this._modules.require(module);
};

Client.prototype.use = function (name) {
    return this._modules.use(name);
};

Client.prototype.isModule = function (name) {
  return this._modules.isModule(name);
};

Client.prototype.getAllModuleNames = function () {
  return this._modules.getAllModuleNames();
};

Client.prototype.getAllModuleExports = function () {
  return this._modules.getAllModuleExports();
};

// Export the class.
module.exports = Client;