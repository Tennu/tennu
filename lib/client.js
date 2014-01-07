const lodash = require('lodash');

const defaultFactoryConfiguration = {
    'NetSocket' : require('net').Socket,
    'IrcSocket' : require('irc-socket'),
    'IrcOutputSocket' : require('./output-socket.js'),
    'MessageHandler' : require('./message-handler.js'),
    'CommandHandler' : require('./command-handler.js'),
    'Modules' : require('tennu-modules'),
    'BiSubscriber' : require('./bisubscriber.js'),
    'Logger': require('./null-logger.js'),
    'NicknameTracker': require('./nickname-tracker.js')
};

const defaultClientConfiguration = {
    server: undefined,
    channels: [],
    nickserv: 'nickserv',
    password: undefined,
    nick: 'tennubot',
    user: 'tennu',
    port: 6667,
    modules: [],
    realname: 'tennu 0.8.0',
    trigger: '!',
    capab: false,
    secure: false
};

const delegate = function (property, method) {
    return function () {
        this[property][method].apply(this[property], arguments);
        return this;
    };
};

/** Fields
 * _config
 * _socket
 * _logger
 * out      (_outputSocket)
 * events   (_subscriber)
 * modules  (_modules)
 * nickname (_nickname)
 */
 const Client = function (config, dependencies) {
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
    const messageHandler = new di.MessageHandler(client, client._logger, client._socket);

    // Create the object that tracks the nickname of the client.
    // Because this object is a function, it is expected that
    // the factory function does not use `this`.
    client._nickname = di.NicknameTracker(config.nick, messageHandler);

    // The output socket wraps the `raw` method of the client._socket.
    client._outputSocket = new di.IrcOutputSocket(client._socket, messageHandler, client._nickname, client._logger);

    // Create the listener to private messages from the IRCMessageEmitter
    // The commander will parse these private messages for commands, and
    // emit those commands, also parsed.
    const commandHandler = new di.CommandHandler(config, client._nickname, client._logger);

    // The subscriber handles event subscriptions to the Client object,
    // determining whether they should be handled by the IrcMessageEmitter
    // or the Command Handler.
    client._subscriber = new di.BiSubscriber(messageHandler, commandHandler);
    client._subscriber.on('privmsg', function (privmsg) { commandHandler.parse(privmsg); });

    // And finally, the module system.
    client._modules = new di.Modules('tennu', client);
    client._modules.addHook('handlers', function (module, handlers) {
        client._subscriber.on(handlers);
    });
    const defaultModules = ['server', 'help', 'user', 'channel'];
    client._modules.use(defaultModules.concat(config.modules), __dirname);


    // Startup stuff!
    client._socket.on('ready', function () {
        // RAWR! I'm a <s>monster</s> Bot!
        client._outputSocket.mode(config.nick, 'B');

        if (config.password) {
            client.notice('Identifying to services.');
            client.say(config.nickserv, 'identify ' + config.password);
        }

        if (Array.isArray(config.channels)) {
            client.notice('Joining default channels.');
            config.channels.forEach(function (channel) {
                client.join(channel);
            });
        }
    });

    client._socket.on('data', function (line) {
        client.info('<-: ' + line);
    });

    // Standard event for IRC quitting.
    client._subscriber.on('error', function () {
        client.notice('Closing IRC Connection.');
        client.disconnect();
    });
    // End of Startup stuff


    client.out = client._outputSocket;
    client.events = client._subscriber;
    client.modules = client._modules;
    client.nickname = client._nickname;

    client.connected = false;

    client.notice('Tennu client created.');
    return client;
};

// implements ConfigurationStorage

Client.prototype.config = function (param) {
    return this._config[param];
};

// implements Runnable ;)

const connect = function () {
    this.debug('Trying to connect.');

    if (this.connected) {
        this.warn('Attempted to start Tennu Client that already is connected.');
        return;
    }

    this._socket.connect();
    this.connected = true;
    this.debug('Connected');
    return this;
}

Client.prototype.connect = connect;
Client.prototype.start = connect;

const disconnect = function () {
    this.debug('Trying to disconnect.');

    if (!this.connected) {
        this.warn('Attempted to end Tennu Client that already is not connected.');
        return;
    }

    this._socket.end();
    this.connected = false;
    this.debug('Disconnected');
    return this;
};

Client.prototype.disconnect = disconnect;
Client.prototype.end = disconnect;

// implements IRC Output Socket

Client.prototype.say = delegate('_outputSocket', 'say');
Client.prototype.act = delegate('_outputSocket', 'act');
Client.prototype.part = delegate('_outputSocket', 'part');
Client.prototype.quit = delegate('_outputSocket', 'quit');
Client.prototype.join = delegate('_outputSocket', 'join');
Client.prototype.userhost = delegate('_outputSocket', 'userhost');
Client.prototype.whois = delegate('_outputSocket', 'whois');
Client.prototype.raw = delegate('_outputSocket', 'raw');
Client.prototype.rawf = delegate('_outputSocket', 'rawf');

Client.prototype.nick = function () {
    // Will remove this error in Tennu 1.0.0 release.
    if (arguments.length === 0) {
        const errormsg = 'tennu.Client#nick() nullary method is removed. Use tennu.Client#nickname() instead.'
        this.error(errormsg);
        throw new TypeError(errormsg);
    }

    return this._outputSocket.nick.apply(this._outputSocket, arguments);
};

// implements BiSubscriber

Client.prototype.on = delegate('_subscriber', 'on');
Client.prototype.once = delegate('_subscriber', 'once');

// implements ModuleSystem

Client.prototype.use = delegate('modules', 'use');
Client.prototype.getModule = delegate('modules', 'moduleExports');
Client.prototype.getRole = delegate('modules', 'roleExports');
Client.prototype.initialize = delegate('modules', 'initialize');
Client.prototype.isInitializable = delegate('modules', 'isInitializable');
Client.prototype.addHook = delegate('modules', 'addHook');

// implements Logger
Client.prototype.debug = delegate('_logger', 'debug');
Client.prototype.info = delegate('_logger', 'info');
Client.prototype.notice = delegate('_logger', 'notice');
Client.prototype.warn = delegate('_logger', 'warn');
Client.prototype.error = delegate('_logger', 'error');
Client.prototype.crit = delegate('_logger', 'crit');
Client.prototype.alert = delegate('_logger', 'alert');
Client.prototype.emerg = delegate('_logger', 'emerg');

Client.prototype.log = function (level) {
    const args = Array.prototype.slice.call(arguments, 1);
    this[level].apply(this, args);
};

// Export the factory.
module.exports = Client;