const lodash = require('lodash');
const defaultFactoryConfiguration = {
        'NetSocket': require('net').Socket,
        'IrcSocket': require('irc-socket'),
        'IrcOutputSocket': require('./output-socket.js'),
        'MessageHandler': require('./message-handler.js'),
        'CommandHandler': require('./command-handler.js'),
        'Modules': require('tennu-modules'),
        'BiSubscriber': require('./bisubscriber.js'),
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
    client._subscriber.on('privmsg', function (privmsg) {
        commandHandler.parse(privmsg);
    });
    // And finally, the module system.
    client._modules = new di.Modules('tennu', client);
    client._modules.addHook('handlers', function (module, handlers) {
        client._subscriber.on(handlers);
    });
    const defaultModules = [
            'server',
            'help',
            'user',
            'channel'
        ];
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
};
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
Client.prototype.say = function () {
    this._outputSocket.say.apply(this._outputSocket, arguments);
    return this;
};
Client.prototype.act = function () {
    this._outputSocket.act.apply(this._outputSocket, arguments);
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
Client.prototype.join = function () {
    this._outputSocket.join.apply(this._outputSocket, arguments);
    return this;
};
Client.prototype.userhost = function () {
    this._outputSocket.userhost.apply(this._outputSocket, arguments);
    return this;
};
Client.prototype.whois = function () {
    this._outputSocket.whois.apply(this._outputSocket, arguments);
    return this;
};
Client.prototype.raw = function () {
    this._outputSocket.raw.apply(this._outputSocket, arguments);
    return this;
};
Client.prototype.rawf = function () {
    this._outputSocket.rawf.apply(this._outputSocket, arguments);
    return this;
};
Client.prototype.nick = function () {
    // Will remove this error in Tennu 1.0.0 release.
    if (arguments.length === 0) {
        const errormsg = 'tennu.Client#nick() nullary method is removed. Use tennu.Client#nickname() instead.';
        this.error(errormsg);
        throw new TypeError(errormsg);
    }
    return this._outputSocket.nick.apply(this._outputSocket, arguments);
};
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
Client.prototype.use = function () {
    this._modules.use.apply(this._modules, arguments);
    return this;
};
Client.prototype.getModule = function () {
    this._modules.moduleExports.apply(this._modules, arguments);
    return this;
};
Client.prototype.getRole = function () {
    this._modules.roleExports.apply(this._modules, arguments);
    return this;
};
Client.prototype.initializeModule = function () {
    this._modules.initialize.apply(this._modules, arguments);
    return this;
};
Client.prototype.isModuleInitializable = function () {
    this._modules.isInitializable.apply(this._modules, arguments);
    return this;
};
Client.prototype.addHook = function () {
    this._modules.addHook.apply(this._modules, arguments);
    return this;
};
Client.prototype.debug = function () {
    this._logger.debug.apply(this._logger, arguments);
    return this;
};
Client.prototype.info = function () {
    this._logger.info.apply(this._logger, arguments);
    return this;
};
Client.prototype.notice = function () {
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
    this[level].apply(this, args);
};
// Export the factory.
module.exports = Client;