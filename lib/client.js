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

var defaultFactoryConfiguration = {
    'NetSocket' : require('net').Socket,
    'IrcSocket' : require('irc-socket'),
    'IrcOutputSocket' : require('./output-socket'),
    'MessageParser' : require('./message-parser'),
    'ChunkedMessageParser' : require('./chunked-message-parser'),
    'CommandParser' : require('./command-parser'),
    'Modules' : require('tennu-modules'),
    'BiSubscriber' : require('./bisubscriber'),
    'Logger': require('./null-logger')
};

var defaultClientConfiguration = {
    server: undefined,
    channels: [],
    nickserv: "nickserv",
    password: undefined,
    nick: "tennubot",
    user: "tennu",
    port: 6667,
    modules: [],
    realname: "tennu 0.5.0",
    trigger: '!',
    capab: false,
    secure: false
};

var delegate = function (property, method) {
    return function () {
        this[property][method].apply(this[property], arguments);
        return this;
    };
};

/** Fields
 * _config
 * _socket
 * _logger
 * out     (_outputSocket)
 * events  (_subscriber)
 * modules (_modules)
 */
 var Client = function (config, dependencies) {
    var client = Object.create(Client.prototype);

    // Parse the configuration object. Make it immutable.
    client._config = config = Object.freeze(lodash.defaults({}, config, defaultClientConfiguration));
    di = lodash.defaults({}, dependencies || {}, defaultFactoryConfiguration);

    // Create a logger.
    // Default logger is a bunch of NOOPs.
    client._logger = new di.Logger();

    // Create a socket.
    // The socket reads and sends messages from/to the IRC server.
    // The output socket wraps the `raw` method.
    client._socket = new di.IrcSocket(config, di.NetSocket);
    client._outputSocket = new di.IrcOutputSocket(client._socket, client._logger, config.nick);

    // Create the listener to the socket.
    // This listener will parse the raw messages of the socket, and
    // emits specific events to listen to.
    var messageParser = new di.MessageParser(client, client._logger, client._socket);

    // Create the listener to private messages from the IRCMessageEmitter
    // The commander will parse these private messages for commands, and
    // emit those commands, also parsed.
    var nickname = client.nickname.bind(client);
    var commandParser = new di.CommandParser(config, nickname, client._logger);

    // The subscriber handles event subscriptions to the Client object,
    // determining whether they should be handled by the IrcMessageEmitter
    // or the Command Parser.
    client._subscriber = new di.BiSubscriber(messageParser, commandParser);
    client._subscriber.on("privmsg", function (privmsg) { commandParser.parse(privmsg); });

    // And finally, the module system.
    client._modules = new di.Modules(client._subscriber, client);
    var require = client._modules.require.bind(client.modules);
    var defaultModules = ['server', 'help', 'user', 'channel'];
    defaultModules.concat(config.modules).forEach(require);


    // Startup stuff!
    client._socket.on('ready', function () {
        // RAWR! I'm a <s>monster</s> Bot!
        client._outputSocket.mode(config.nick, "B");

        if (config.password) {
            client.notice("Identifying to services.");
            client.say(config.nickserv, "identify " + config.password);
        }

        if (util.isArray(config.channels)) {
            client.notice("Joining default channels.");
            config.channels.forEach(function (channel) {
                client.join(channel);
            });
        }
    });

    client._socket.on('data', function (line) {
        client.info("<-: " + line);
    });

    // Standard event for IRC quitting.
    client._subscriber.on("error", function () {
        client.notice("Closing IRC Connection.");
        client.disconnect();
    });

    client.out = client._outputSocket;
    client.events = client._subscriber;
    client.modules = client._modules;

    client.connected = false;

    client.notice("Tennu client created.");
    return client;
};

// implements ConfigurationStorage

Client.prototype.config = function (param) {
    return this._config[param];
};

// implements Runnable ;)

var connect = function () {
    this.debug("Trying to connect.");

    if (this.connected) {
        this.warn("Attempted to start Tennu Client that already is connected.");
        return;
    }

    this._socket.connect();
    this.connected = true;
    this.debug("Connected");
    return this;
}

Client.prototype.connect = connect;
Client.prototype.start = connect;

var disconnect = function () {
    this.debug("Trying to disconnect.");

    if (!this.connected) {
        this.warn("Attempted to end Tennu Client that already is not connected.");
        return;
    }

    this._socket.end();
    this.connected = false;
    this.debug("Disconnected");
    return this;
};

Client.prototype.disconnect = disconnect;
Client.prototype.end = disconnect;

// Nick Tracking

Client.prototype.nickname = function () {
    // Change this to delegate once there is a nick tracking object.
    return this._outputSocket.nick();
};

// implements IRC Output Socket

Client.prototype.say = delegate("_outputSocket", "say");
Client.prototype.act = delegate("_outputSocket", "act");
Client.prototype.part = delegate("_outputSocket", "part");
Client.prototype.quit = delegate("_outputSocket", "quit");
Client.prototype.join = delegate("_outputSocket", "join");
Client.prototype.userhost = delegate("_outputSocket", "userhost");
Client.prototype.whois = delegate("_outputSocket", "whois");
Client.prototype.raw = delegate("_outputSocket", "raw");

Client.prototype.nick = function () {
    if (arguments.length === 0) {
        this.notice("tennu.Client#nick() nullary method is deprecated, and will be removed in Tennu 0.8.0. Use tennu.Client#nickname() instead.");
    }

    var nick = this._outputSocket.nick.apply(this._outputSocket, arguments);
    return nick || this;
};

// implements BiSubscriber

Client.prototype.on = delegate("_subscriber", "on");
Client.prototype.once = delegate("_subscriber", "once");

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

// implements Logger
Client.prototype.debug = delegate("_logger", "debug");
Client.prototype.info = delegate("_logger", "info");
Client.prototype.notice = delegate("_logger", "notice");
Client.prototype.warn = delegate("_logger", "warn");
Client.prototype.error = delegate("_logger", "error");
Client.prototype.crit = delegate("_logger", "crit");
Client.prototype.alert = delegate("_logger", "alert");
Client.prototype.emerg = delegate("_logger", "emerg");

Client.prototype.log = function (level) {
    var args = Array.prototype.slice.call(arguments, 1);
    this[level].apply(this, args);
};

// Export the factory.
module.exports = Client;