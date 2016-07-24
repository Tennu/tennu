const TlsSocket = require("tls").TLSSocket;
const format = require("util").format;
const inspect = require("util").inspect;
const defaults = require("lodash.defaults");
const mapValues = require("lodash.mapvalues");

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
        this.warn('Tennu', 'Attempted to disconnect already disconnected client.');
        return this;
    }
    this._socket.end();
    this.connected = false;
    this.note('Tennu', 'Disconnected');
    return this;
};

Client.prototype.disconnect = disconnect;
Client.prototype.end = disconnect;

// implements Config Plugin
Client.prototype.config = function () {
    return this._config.get.apply(this._config, arguments);
};

// implements IRC Output Socket
Client.prototype.act = function () {
    return this._action.act.apply(this._action, arguments);
};

// Deprecated(4.2.x)
Client.prototype.ctcp = function () {
    return this._action.ctcp.apply(this._action, arguments);
};

Client.prototype.ctcpRequest = function () {
    return this._action.ctcpRequest.apply(this._action, arguments);
};

Client.prototype.ctcpRespond = function () {
    return this._action.ctcpRespond.apply(this._action, arguments);
};

Client.prototype.join = function () {
    return this._action.join.apply(this._action, arguments);
};

Client.prototype.kick = function () {
    return this._action.kick.apply(this._action, arguments);
};

Client.prototype.mode = function () {
    return this._action.mode.apply(this._action, arguments);
};

Client.prototype.nick = function () {
    return this._action.nick.apply(this._action, arguments);
};

Client.prototype.notice = function () {
    return this._action.notice.apply(this._action, arguments);
};

Client.prototype.part = function () {
    return this._action.part.apply(this._action, arguments);
};

Client.prototype.quit = function () {
    return this._action.quit.apply(this._action, arguments);
};

Client.prototype.say = function () {
    return this._action.say.apply(this._action, arguments);
};

Client.prototype.respond = function () {
    return this._action.respond.apply(this._action, arguments);
};

Client.prototype.userhost = function () {
    return this._action.userhost.apply(this._action, arguments);
};

Client.prototype.who = function () {
    return this._action.who.apply(this._action, arguments);
};

Client.prototype.whois = function () {
    return this._action.whois.apply(this._action, arguments);
};

Client.prototype.raw = function () {
    return this._action.raw.apply(this._action, arguments);
};

Client.prototype.rawf = function () {
    return this._action.rawf.apply(this._action, arguments);
};

// implements Self Plugin Exports
Client.prototype.nickname = function () {
    return this._self.nickname.apply(this._self, arguments);
};

// implements Subscriber
Client.prototype.on = function () {
    this._subscriber.on.apply(this._subscriber, arguments);
    return this;
};

Client.prototype.once = function () {
    this._subscriber.once.apply(this._subscriber, arguments);
    return this;
};

Client.prototype.off = function () {
    this._subscriber.off.apply(this._subscriber, arguments);
    return this;
};

// implements PluginSystem
Client.prototype.use = function () {
    this._plugins.use.apply(this._plugins, arguments);
    return this;
};

Client.prototype.getPlugin = function () {
    return this._plugins.getPlugin.apply(this._plugins, arguments);
};

Client.prototype.getRole = function () {
    return this._plugins.getRole.apply(this._plugins, arguments);
};

Client.prototype.initializePlugin = function () {
    this._plugins.initialize.apply(this._plugins, arguments);
    return this;
};

Client.prototype.isPluginInitializable = function () {
    return this._plugins.isInitializable.apply(this._plugins, arguments);
};

Client.prototype.addHook = function () {
    this._plugins.addHook.apply(this._plugins, arguments);
    return this;
};

// implements Logger
Client.prototype.debug = function () {
    this._logger.debug.apply(this._logger, arguments);
    return this;
};

Client.prototype.info = function () {
    this._logger.info.apply(this._logger, arguments);
    return this;
};

Client.prototype.note = function () {
    this._logger.notice.apply(this._logger, arguments);
    return this;
};

Client.prototype.warn = function () {
    this._logger.warn.apply(this._logger, arguments);
    return this;
};

Client.prototype.error = function () {
    this._logger.error.apply(this._logger, arguments);
    return this;
};

Client.prototype.crit = function () {
    this._logger.crit.apply(this._logger, arguments);
    return this;
};

Client.prototype.alert = function () {
    this._logger.alert.apply(this._logger, arguments);
    return this;
};

Client.prototype.emerg = function () {
    this._logger.emerg.apply(this._logger, arguments);
    return this;
};

Client.prototype.log = function (level) {
    const args = Array.prototype.slice.call(arguments, 1);
    this._logger[level].apply(this._logger, args);
    return this;
};

// Export the factory.
module.exports = Client;