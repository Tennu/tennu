const TlsSocket = require("tls").TLSSocket;
const format = require("util").format;
const inspect = require("util").inspect;
const defaults = require("lodash.defaults");
const mapValues = require("lodash.mapvalues");

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

const deepClone = function (obj) {
    if (obj === null) {
        return null;
    } else if (Array.isArray(obj)) {
        return obj.map(deepClone);
    } else if (typeof obj === "object") {
        const ret = Object.create(Object.getPrototypeOf(obj));
        Object.keys(obj).forEach(function (key) {
            ret[key] = deepClone(obj[key]);
        });
        return ret;
    } else {
        return obj;
    }
};

// Because lodash.defaults doesn't clone.
const clonedDefaults = function () {
    const source = arguments[0];
    const templates = Array.prototype.slice.call(arguments, 1);

    templates.forEach(function (template) {
        Object.keys(template).forEach(function (key) {
            if (!source[key]) {
                source[key] = deepClone(template[key]);
            }
        });
    });

    return source;
};

const defaultFactoryConfiguration = {
    "NetSocket" : require("net").Socket,
    "IrcSocket" : require("irc-socket"),
    "Plugins" : require("tennu-plugins"),
    "Logger": require("./null-logger.js"),
};

const defaultClientConfiguration = Object.freeze({
    // IrcSocket Config
    "server": undefined,
    "port": 6667,
    "password": undefined,
    "capabilities": {},
    "nicknames": Object.freeze(["tennubot"]),
    "username": "tennu",
    "realname": "tennu " + require("../package.json")["version"],
    "connectOptions": undefined,

    // Tennu Config
    "tls": false,
    "channels": Object.freeze([]),
    "nickserv": "nickserv",
    "auth-password": undefined,
    "plugins": Object.freeze([]),
    "command-trigger": "!",
    "disable-help": false
});

const loggerMethods = ["debug", "info", "notice", "warn", "error", "crit", "alert", "emerg"];

/** Fields
 * _config
 * _socket
 * _logger
 * _action
 * _self
 * _subscriber
 * events   (_subscriber)
 * plugins  (_plugins)
 */
 const Client = function (config, dependencies) {
    const client = Object.create(Client.prototype);

    // Parse the configuration object.
    client._configObject = config = clonedDefaults({}, config, defaultClientConfiguration);

    // Allow dependencies to either be constructors or objects.
    dependencies = mapValues(dependencies, function (dep) {
        if (typeof dep === "object") {
            return function () { return dep; };
        } else {
            return dep;
        }
    });
    di = defaults({}, dependencies || {}, defaultFactoryConfiguration);

    // Create a logger.
    // Default logger is a bunch of NOOPs.
    client._logger = new di.Logger();
    var missingLoggerMethods = loggerMethods.filter(function (method) {
        return typeof client._logger[method] !== "function";
    });
    if (missingLoggerMethods.length !== 0) {
        throw new Error(format("Logger passed to tennu.Client is missing the following methods: %s", inspect(missingLoggerMethods)));
    }

    var netSocket = new di.NetSocket();
    if (config.tls) {
        netSocket = new TlsSocket(netSocket, {
            rejectUnauthorized: false,
            isServer: false
        });
    }

    // NOTE(Havvy): The config plugin has to be loaded before the IRC socket is started.
    //              It also has to be loaded so that we have a value for client._config
    //              so that client.config() works for other plugins.
    client._plugins = new di.Plugins("tennu", client);
    client._plugins.use(["config"], __dirname);
    client._config = client.getPlugin("config");

    // The socket reads and sends messages from/to the IRC server.
    // TODO(Havvy): Put the Socket into a plugin.
    client._socket = new di.IrcSocket(config, netSocket);

    // Configure the plugin system.
    client.note("Tennu", "Loading base plugins");
    var basePlugins = [
        "subscriber",
        "messages",
        "commands",
        "server",
        "action",
        "ctcp",
        "help",
        "user",
        "channel",
        "startup",
        "self"
    ];
    if (config.daemon === "twitch" || config.daemon === "irc2") {
        // The channel plugin requires certain capabilities that these networks cannot provide.
        basePlugins = basePlugins.filter(function (plugin) { return plugin !== "channel"; });
    }
    client._plugins.use(basePlugins, __dirname);
    client.note("Tennu", "Loading your plugins");
    client._plugins.use(config.plugins || [], process.cwd());

    // Grab a reference to various plugin exports
    // so that the client can delegate the actions to it.
    // TODO(Havvy): Have a static hook for doing this.
    //              Note how "config" has to be loaded specially above.
    client._action = client.getPlugin("action");
    client._self = client.getPlugin("self");
    client._subscriber = client.getPlugin("subscriber");

    client.plugins = client._plugins;

    client.connected = false;

    client.note("Tennu", "Client created.");
    return client;
};

// implements Runnable ;)

const connect = function () {
    if (this.connected) {
        this.warn("Tennu", "Attempted to connect already connected client.");
        return;
    }

    this._socket.connect();
    this.connected = true;
    this.note("Tennu", "Connected");
    return this;
}

Client.prototype.connect = connect;
Client.prototype.start = connect;

const disconnect = function () {
    if (!this.connected) {
        this.warn("Tennu", "Attempted to disconnect already disconnected client.");
        return this;
    }

    this._socket.end();
    this.connected = false;
    this.note("Tennu", "Disconnected");
    return this;
};

Client.prototype.disconnect = disconnect;
Client.prototype.end = disconnect;

// implements Config Plugin
Client.prototype.config                 = delegate_ret _config get

// implements IRC Output Socket
Client.prototype.act                    = delegate_ret _action act;

// Deprecated(4.2.x)
Client.prototype.ctcp                   = delegate_ret _action ctcp;

Client.prototype.ctcpRequest            = delegate_ret _action ctcpRequest;
Client.prototype.ctcpRespond            = delegate_ret _action ctcpRespond;
Client.prototype.join                   = delegate_ret _action join;
Client.prototype.kick                   = delegate_ret _action kick;
Client.prototype.mode                   = delegate_ret _action mode;
Client.prototype.nick                   = delegate_ret _action nick;
Client.prototype.notice                 = delegate_ret _action notice;
Client.prototype.part                   = delegate_ret _action part;
Client.prototype.quit                   = delegate_ret _action quit;
Client.prototype.say                    = delegate_ret _action say;
Client.prototype.userhost               = delegate_ret _action userhost;
Client.prototype.who                    = delegate_ret _action who;
Client.prototype.whois                  = delegate_ret _action whois;
Client.prototype.raw                    = delegate_ret _action raw;
Client.prototype.rawf                   = delegate_ret _action rawf;

// implements Self Plugin Exports
Client.prototype.nickname               = delegate_ret _self nickname;

// implements Subscriber
Client.prototype.on                     = delegate _subscriber on;
Client.prototype.once                   = delegate _subscriber once;
Client.prototype.off                    = delegate _subscriber off;

// implements PluginSystem
Client.prototype.use                    = delegate     _plugins use;
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
    this._logger[level].apply(this._logger, args);
    return this;
};

// Export the factory.
module.exports = Client;