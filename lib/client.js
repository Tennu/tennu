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

var util = require('util');
var lodash = require('lodash');

var debug = function (msg) {
    if (false) {
        console.log('' + Date.now() + '|TENNU|' + msg);
    }
};

var defaultFactoryConfiguration = {
    'NetSocket' : require('net').Socket,
    'IrcSocket' : require('irc-socket'),
    'IrcOutputSocket' : require('./output-socket'),
    'MessageParser' : require('./message-parser'),
    'ChunkedMessageParser' : require('./chunked-message-parser'),
    'CommandParser' : require('./command-parser'),
    'Modules' : require('tennu-modules'),
    'BiSubscriber' : require('./bisubscriber')
};

var defaultClientConfiguration = {
    channels: [],
    nickserv: "nickserv",
    password: undefined,
    nick: "tennubot",
    user: "tennu",
    port: 6667,
    modules: [],
    realname: "tennu 0.5.0",
    trigger: '!'
};

/** Fields
 * _config
 * _socket
 * out     (_outputSocket)
 * events  (_subscriber)
 * modules (_modules)
 */
 var Client = function (config, dependencies) {
    var client = Object.create(Client.prototype);

    debug("Creating new Tennu instance.");

    // Parse the configuration object. Make it immutable.
    client._config = config = Object.freeze(lodash.defaults({}, config, defaultClientConfiguration));
    di = Object.freeze(lodash.defaults({}, dependencies || {}, defaultFactoryConfiguration));

    debug("Dependency Injection");

    // Create a socket.
    // The socket reads and sends messages from/to the IRC server.
    // The output socket wraps the `raw` method.
    client._socket = new di.IrcSocket(config, di.NetSocket);
    client._outputSocket = new di.IrcOutputSocket(client._socket, config.nick);

    // Find a new place for this.
    // Maybe as part of the IrcSocket refactored for accepting a
    // startup sequence.
    client._socket.on('ready', function () {
        // RAWR! I'm a <s>monster</s> Bot!
        client._outputSocket.mode(config.nick, "B");

        if (config.password) {
            debug("Identifying to services.");
            client.say(config.nickserv, "identify " + config.password);
        }

        if (util.isArray(config.channels)) {
            debug("Joining default channels.");
            config.channels.forEach(function (channel) {
                client.join(channel);
            });
        }
    });

    // Create the listener to the socket.
    // This listener will parse the raw messages of the socket, and
    // emits specific events to listen to.
    var messageParser = new di.MessageParser(client, client._socket);

    // Create the listener to private messages from the IRCMessageEmitter
    // The commander will parse these private messages for commands, and
    // emit those commands, also parsed.
    var commandParser = new di.CommandParser(client.nick.bind(client), config);

    // The subscriber handles event subscriptions to the Client object,
    // determining whether they should be handled by the IrcMessageEmitter
    // or the Command Parser.
    client._subscriber = new di.BiSubscriber(messageParser, commandParser);
    client._subscriber.on("privmsg", commandParser.parse.bind(commandParser));

    // And finally, the module system.
    client._modules = new di.Modules(client._subscriber, client);
    var require = client._modules.require.bind(client.modules);
    var defaultModules = ['server', 'help', 'user', 'channel'];
    defaultModules.concat(config.modules).forEach(require);

    // Standard event for IRC quitting.
    client._subscriber.on("error", function () {
        client.disconnect();
    });

    client.out = client._outputSocket;
    client.events = client._subscriber;
    client.modules = client._modules;

    client.connected = false;

    return client;
};

// implements ConfigurationStorage

Client.prototype.config = function (param) {
    return this._config[param];
};

// implements Runnable ;)

var connect = function () {
    debug("Trying to connect.");

    if (this.connected) {
        debug("Already connected.");
        return;
    }

    this._socket.connect();
    this.connected = true;
    debug("Connected");
    return this;
}

Client.prototype.connect = connect;
Client.prototype.start = connect;

var disconnect = function () {
    debug("Trying to disconnect.");

    if (!this.connected) {
        debug("Already disconnected.");
        return;
    }

    this._socket.end();
    this.connected = false;
    return this;
};

Client.prototype.disconnect = disconnect;
Client.prototype.end = disconnect;

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

Client.prototype.raw = function () {
    this._outputSocket.raw.apply(this._outputSocket, arguments);
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

// partially implements ModuleSubscriber

Client.prototype.load = function (module) {
    return this._modules.load(module);
};

Client.prototype.require = function (module) {
    return this._modules.require(module);
};

Client.prototype.exports = Client.prototype.require;

Client.prototype.loaded = function () {
    return this._modules.loadedModules()
};

// Export the class.
module.exports = Client;