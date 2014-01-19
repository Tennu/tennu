const lodash = require('lodash');

macro delegate {
    rule { $property:ident $method:ident } => {
        function () {
            this . $property . $method . apply (this . $property , arguments);
            return this;
        }
    }
}

const defaultFactoryConfiguration = {
    'NetSocket' : require('net').Socket,
    'IrcSocket' : require('irc-socket'),
    'IrcOutputSocket' : require('./output-socket.js'),
    'MessageHandler' : require('./message-handler.js'),
    'CommandHandler' : require('./command-handler.js'),
    'Plugins' : require('tennu-plugins'),
    'BiSubscriber' : require('./bisubscriber.js'),
    'Logger': require('./null-logger.js'),
    'NicknameTracker': require('./nickname-tracker.js')
};

const defaultClientConfiguration = {
    // IrcSocket Config
    'server': undefined,
    'port': 6667,
    'ipv6': undefined,
    'localAddress': undefined,
    'secure': false,
    'password': undefined,
    'capab': false,
    'nickserv': 'nickserv',
    'nickname': 'tennubot',
    'username': 'tennu',
    'realname': 'tennu 0.9.x',

    // Tennu Config
    'channels': [],
    'auth-password': undefined,
    'plugins': [],
    'command-trigger': '!',
    'disable-help': false
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
    if (config.nick || config.user) {
        throw new Error('Please use \'nickname\' and \'username\' instead of \'nick\' or \'user\' in your configuration.');
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
    const messageHandler = new di.MessageHandler(client, client._logger, client._socket);

    // Create the object that tracks the nickname of the client.
    // Because this object is a function, it is expected that
    // the factory function does not use `this`.
    client._nickname = di.NicknameTracker(config.nickname, messageHandler);

    // The output socket wraps the `raw` method of the client._socket.
    client._outputSocket = new di.IrcOutputSocket(client._socket, messageHandler, client._nickname, client._logger);

    // Create the listener to private messages from the IRCMessageEmitter
    // The commander will parse these private messages for commands, and
    // emit those commands, also parsed.
    const commandHandler = new di.CommandHandler(config, client, client._nickname, client._logger);

    // The subscriber handles event subscriptions to the Client object,
    // determining whether they should be handled by the IrcMessageEmitter
    // or the Command Handler.
    client._subscriber = new di.BiSubscriber(messageHandler, commandHandler);
    client._subscriber.on('privmsg', function (privmsg) { commandHandler.parse(privmsg); });

    // And finally, the module system.
    client._modules = new di.Plugins('tennu', client);
    client._modules.addHook('handlers', function (module, handlers) {
        client._subscriber.on(handlers);
    });
    client.notice('Tennu', 'Loading default plugins');
    client._modules.use(['server', 'help', 'user', 'channel'], __dirname);
    client.notice('Tennu', 'Loading your plugins');
    client._modules.use(config.plugins || [], process.cwd());


    // Startup stuff!
    client._socket.on('ready', function () {
        // RAWR! I'm a <s>monster</s> Bot!
        client._outputSocket.mode(config.nick, 'B');

        if (config['auth-password']) {
            client.notice('Tennu', 'Identifying to services.');
            client.say(config.nickserv, 'identify ' + config['auth-password']);
        }

        if (Array.isArray(config.channels)) {
            client.notice('Tennu', 'Joining default channels.');
            config.channels.forEach(function (channel) {
                client.join(channel);
            });
        }
    });

    client._socket.on('data', function (line) {
        client.info('<-', line);
    });

    // Standard event for IRC quitting.
    client._subscriber.on('error', function () {
        client.notice('Tennu', 'Closing IRC Connection.');
        client.disconnect();
    });
    // End of Startup stuff


    client.out = client._outputSocket;
    client.events = client._subscriber;
    client.modules = client._modules;
    client.nickname = client._nickname;

    client.connected = false;

    client.notice('Tennu', 'Client created.');
    return client;
};

// implements ConfigurationStorage

Client::config = function (param) {
    return this._config[param];
};

// implements Runnable ;)

const connect = function () {
    this.debug('Tennu', 'Trying to connect.');

    if (this.connected) {
        this.warn('Tennu', 'Attempted to start Tennu Client that already is connected.');
        return;
    }

    this._socket.connect();
    this.connected = true;
    this.debug('Tennu', 'Connected');
    return this;
}

Client::connect = connect;
Client::start = connect;

const disconnect = function () {
    this.debug('Tennu', 'Trying to disconnect.');

    if (!this.connected) {
        this.warn('Tennu', 'Attempted to end Tennu Client that already is not connected.');
        return;
    }

    this._socket.end();
    this.connected = false;
    this.debug('Tennu', 'Disconnected');
    return this;
};

Client::disconnect = disconnect;
Client::end = disconnect;

// implements IRC Output Socket

Client::say                    = delegate _outputSocket say;
Client::act                    = delegate _outputSocket act;
Client::part                   = delegate _outputSocket part;
Client::quit                   = delegate _outputSocket quit;
Client::join                   = delegate _outputSocket join;
Client::userhost               = delegate _outputSocket userhost;
Client::whois                  = delegate _outputSocket whois;
Client::nick                   = delegate _outputSocket nick;
Client::raw                    = delegate _outputSocket raw;
Client::rawf                   = delegate _outputSocket rawf;

// implements BiSubscriber
Client::on                     = delegate _subscriber on;
Client::once                   = delegate _subscriber once;
Client::off                    = delegate _subscriber off;

// implements ModuleSystem
Client::use                    = delegate _modules use;
Client::getModule              = delegate _modules moduleExports;
Client::getRole                = delegate _modules roleExports;
Client::initializePlugin       = delegate _modules initialize;
Client::isPluginInitializable  = delegate _modules isInitializable;
Client::addHook                = delegate _modules addHook;

// implements Logger
Client::debug                  = delegate _logger debug;
Client::info                   = delegate _logger info;
Client::notice                 = delegate _logger notice;
Client::warn                   = delegate _logger warn;
Client::error                  = delegate _logger error;
Client::crit                   = delegate _logger crit;
Client::alert                  = delegate _logger alert;
Client::emerg                  = delegate _logger emerg;

Client::log = function (level) {
    const args = Array::slice.call(arguments, 1);
    this[level].apply(this, args);
};

// Export the factory.
module.exports = Client;