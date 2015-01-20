const lodash = require("lodash");
const packagejson = require("../package.json")[""]

// delegate x y -> function () { this.x.y.apply(this.x, arguments); return this; }
macro delegate {
    rule { $property:ident $method:ident } => {
        function () {
            this . $property . $method . apply (this . $property , arguments);
            return this;
        }
    }
}

// delegate_ret x y -> function () { return this.x.y.apply(this.x, arguments); }
macro delegate_ret {
    rule { $property:ident $method:ident } => {
        function () {
            return this . $property . $method . apply (this . $property, arguments);
        }
    }
}

const defaultFactoryConfiguration = {
    "NetSocket" : require("net").Socket,
    "IrcSocket" : require("irc-socket"),
    "MessageHandler" : require("./message-handler.js"),
    "CommandHandler" : require("./command-handler.js"),
    "Plugins" : require("tennu-plugins"),
    "BiSubscriber" : require("./bisubscriber.js"),
    "Logger": require("./null-logger.js"),
    "NicknameTracker": require("./nickname-tracker.js")
};

const defaultClientConfiguration = {
    // IrcSocket Config
    "server": undefined,
    "port": 6667,
    "ipv6": undefined,
    "localAddress": undefined,
    "secure": false,
    "password": undefined,
    "capab": false,
    "nickname": "tennubot",
    "username": "tennu",
    "realname": "tennu " + require("../package.json")["version"],

    // Tennu Config
    "channels": [],
    "nickserv": "nickserv",
    "auth-password": undefined,
    "plugins": [],
    "command-trigger": "!",
    "disable-help": false
};

/** Fields
 * _config
 * _socket
 * _logger
 * out      (_outputSocket)
 * events   (_subscriber)
 * plugins  (_plugins)
 * nickname (_nickname)
 */
 const Client = function (config, dependencies) {
    if (config.nick || config.user) {
        throw new Error("Please use \"nickname\" and \"username\" instead of \"nick\" and \"user\" in your configuration.");
    }

    const client = Object.create(Client.prototype);

    // Parse the configuration object. Make it immutable.
    client._config = config = Object.freeze(lodash.defaults({}, config, defaultClientConfiguration));
    di = lodash.defaults({}, dependencies || {}, defaultFactoryConfiguration);

    // Create a logger.
    // Default logger is a bunch of NOOPs.
    client._logger = new di.Logger();

    // The socket reads and sends messages from/to the IRC server.
    client._socket = new di.IrcSocket(config, di.NetSocket);

    // Create the listener to the socket.
    // This listener will parse the raw messages of the socket, and
    // emits specific events to listen to.
    client._messageHandler = new di.MessageHandler(client, client._logger, client._socket);

    // Create the object that tracks the nickname of the client.
    // Because this object is a function, it is expected that
    // the factory function does not use `this`.
    client._nickname = di.NicknameTracker(config.nickname, client._messageHandler);

    // Create the listener to private messages from the IRCMessageEmitter
    // The commander will parse these private messages for commands, and
    // emit those commands, also parsed.
    const commandHandler = new di.CommandHandler(config, client, client._nickname, client._logger);

    // The subscriber handles event subscriptions to the Client object,
    // determining whether they should be handled by the IrcMessageEmitter
    // or the Command Handler.
    client._subscriber = new di.BiSubscriber(client._messageHandler, commandHandler);
    client._subscriber.on("privmsg", function (privmsg) { commandHandler.parse(privmsg); });

    // Configure the plugin system.
    client._plugins = new di.Plugins("tennu", client);
    client._plugins.addHook("handlers", function (module, handlers) {
        client._subscriber.on(handlers);
    });
    client.note("Tennu", "Loading default plugins");
    client._plugins.use(["server", "action", "help", "user", "channel", "startup"], __dirname);
    client.note("Tennu", "Loading your plugins");
    client._plugins.use(config.plugins || [], process.cwd());

    // Grab a reference to the "action" plugin exports, so that the client
    // can delegate the actions to it.
    client._actionExports = client.getPlugin("action");

    client.out = client._outputSocket;
    client.events = client._subscriber;
    client.plugins = client._plugins;
    client.nickname = client._nickname;

    client.connected = false;

    client.note("Tennu", "Client created.");
    return client;
};

// implements ConfigurationStorage

Client.prototype.config = function (param) {
    return this._config[param];
};

// implements Runnable ;)

const connect = function () {
    this.debug("Tennu", "Trying to connect.");

    if (this.connected) {
        this.warn("Tennu", "Attempted to start Tennu Client that already is connected.");
        return;
    }

    this._socket.connect();
    this.connected = true;
    this.debug("Tennu", "Connected");
    return this;
}

Client.prototype.connect = connect;
Client.prototype.start = connect;

const disconnect = function () {
    this.debug("Tennu", "Trying to disconnect.");

    if (!this.connected) {
        this.warn("Tennu", "Attempted to end Tennu Client that already is not connected.");
        return this;
    }

    this._socket.end();
    this.connected = false;
    this.debug("Tennu", "Disconnected");
    return this;
};

Client.prototype.disconnect = disconnect;
Client.prototype.end = disconnect;

// implements IRC Output Socket
Client.prototype.act                    = delegate_ret _actionExports act;
Client.prototype.ctcp                   = delegate_ret _actionExports ctcp;
Client.prototype.join                   = delegate_ret _actionExports join;
Client.prototype.mode                   = delegate_ret _actionExports mode;
Client.prototype.nick                   = delegate_ret _actionExports nick;
Client.prototype.notice                 = delegate_ret _actionExports notice;
Client.prototype.part                   = delegate_ret _actionExports part;
Client.prototype.quit                   = delegate_ret _actionExports quit;
Client.prototype.say                    = delegate_ret _actionExports say;
Client.prototype.userhost               = delegate_ret _actionExports userhost;
Client.prototype.who                    = delegate_ret _actionExports who;
Client.prototype.whois                  = delegate_ret _actionExports whois;
Client.prototype.raw                    = delegate_ret _actionExports raw;
Client.prototype.rawf                   = delegate_ret _actionExports rawf;

// implements BiSubscriber
Client.prototype.on                     = delegate _subscriber on;
Client.prototype.once                   = delegate _subscriber once;
Client.prototype.off                    = delegate _subscriber off;

// implements PluginSystem
Client.prototype.use                    = delegate     _plugins use;
Client.prototype.getModule              = delegate_ret _plugins getPlugin;
Client.prototype.getPlugin              = delegate_ret _plugins getPlugin
Client.prototype.getRole                = delegate_ret _plugins getRole;
Client.prototype.initializePlugin       = delegate     _plugins initialize;
Client.prototype.isPluginInitializable  = delegate_ret _plugins isInitializable;
Client.prototype.addHook                = delegate     _plugins addHook;

// implements Logger
Client.prototype.debug                  = delegate _logger debug;
Client.prototype.info                   = delegate _logger info;
Client.prototype.note                   = delegate _logger notice;
Client.prototype.warn                   = delegate _logger warn;
Client.prototype.error                  = delegate _logger error;
Client.prototype.crit                   = delegate _logger crit;
Client.prototype.alert                  = delegate _logger alert;
Client.prototype.emerg                  = delegate _logger emerg;

Client.prototype.log = function (level) {
    const args = Array.prototype.slice.call(arguments, 1);
    this[level].apply(this, args);
};

// Export the factory.
module.exports = Client;