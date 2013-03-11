/*
 * IRC Socket - handles communication between an IRC server and a Node.js script.
 *
 * The constructor takes a network configuration object and a dependency 
 * injection object.
 *
 * This socket exposes the connect and end methods of the socket Interface.
 *
 * A network configuration object needs the following properties:
 *   server   - IRC server to connect to. _Example:_ _irc.mibbit.net_
 *   nick     - Nickname the bot will use.
 *   user     - Username the bot will use.
 *   realname - Realname for the bot.
 *   port     - Port to connect to. Defaults to 6667.
 *
 * The dependency injection object has one field: Socket, which is the 
 * socket class to use for the impl. Defaults to require('net').Socket.
 *
 * From the perspective of the socket, the only default value is the port.
 * The rest of the defaults are added by the NRC object.
 *
 * ## Writing to the Server ##
 * To send messages to the server, use socket.raw(). It accepts either a
 * string or an array which it will convert into a string by joining with
 * a space. The message must follow the IRC protocol. For example, to send a
 * message to the channel #biscuits, you would send one of the following:
 *
 *   socket.raw("PRIVMSG #biscuits :The message!");
 *   socket.raw(["PRIVMSG", "#biscuits", ":The message!"]);
 *
 * The raw method does not allow the usage of newline characters. This is
 * mostly a security concern, so that if the user of the Socket doesn't
 * validate input, an evil user can't send a command causing the bot to quit:
 *
 *   <eviluser>!say SUCKAS \nQUIT :Mua ha ha
 *
 * ## Reading from the Server ##
 *
 * Not counting PING messages, which are automatically handled by the socket,
 * all other messages will be sent from the socket via a 'data' event. The
 * event will pass one parameter, being one command from the server. Here
 * are some examples:
 *
 *   :irc.uk.mibbit.net 376 Havvy :End of /MOTD command.
 *   :NyanCat!Mibbit@mib-ABE399B0.redacted.com QUIT :Quit: http://www.mibbit.com ajax IRC Client
 *   ERROR :Closing Link: Havvy[127-00-00-00.redacted.com] (Quit: I got the messages I want.)
 *
 * ## Public methods ##
 *   - new(network: Object[, opt: Object]): IRCSocket
 *   - connect(): undefined
 *   - start(): undefined
 *   - end(): undefined
 *   - disconnect(): undefined
 *   - raw(message: List[String]): undefined
 *   - raw(message: String): undefined
 *   - isConnected(): boolean
 *   - getRealName(): String
 *   - onConnect(callback: function): undefined
 *   - onDisconnect(callback: function): undefined
 *   + (from events.EventEmitter)
 *     - on
 *     - once
 *
 * ## Events ##
 *   - ready(): Once the first 001 message has been acknowledged.
 *   - data(message: String): Every message (including the 001) from the
 *     sender (inclusive) the the newline (exclusive).
 */

 var net = require('net');
 var events = require('events');
 var util = require('util');

 var Socket = function (network, di) {
    that = this;
    var Socket = (di && di.Socket) || net.Socket;

    this.port = network.port || 6667;
    this.netname = network.server;
    this.server = new Socket();
    this.connected = false;

    /**
     * @TODO Do not send last message if not finished
     * @TODO Refactor this to be less confusing.
     */
     var onData = function (data) {
        data = data.split('\r\n');
        // Filter-Filter-Map pattern.
        for (var ix = 0; ix < data.length; ix++) {
            var line = data[ix];

            // Filter empty lines.
            if (line === '') {
                continue;
            }

            // Filter pings.
            if (line.indexOf('PING') === 0) {
                var reply = line.slice(line.indexOf(':'));
                that.raw(["PONG", reply]);
                continue;
            }

            // Map event emitting.
            that.emit('data', line);
        }
    };

    var determineWhenReady = function (data) {
        // We are 'ready' when we get a 001 message.

        data = data.split('\r\n');
        // Filter-Filter-Map pattern.
        for (var ix = 0; ix < data.length; ix++) {
            var line = data[ix];

            // Filter empty lines.
            if (line.length === 0) {
                continue;
            }
            line = line.split(" ");
            if (line[1] === "001") {
                that.emit("ready");
                that.server.removeListener('data', determineWhenReady);
                break;
            }
        }
    };

    this.server.once('connect', function () {
        that.connected = true;
        that.raw(["NICK", network.nick]);
        that.raw(["USER", network.user || "user", "8 * :" + network.realname]);
    });

    this.once('ready', function () {
        // RAWR! I'm a <s>monster</s> Bot!
        that.raw(["MODE", network.nick, ":+B"]);
    });

    this.server.once('close', function () {
        that.connected = false;
    });

    this.server.on('data', onData);
    this.server.on('data', determineWhenReady);
    this.server.setEncoding('ascii');
    this.server.setNoDelay();
};

Socket.prototype = new events.EventEmitter();
Socket.prototype.constructor = Socket;

Socket.prototype.connect = function () {
    if (this.isConnected()) {
        return;
    }

    this.server.connect(this.port, this.netname);
};

Socket.prototype.start = Socket.prototype.connect;

Socket.prototype.end = function () {
    if (!this.isConnected()) {
        return;
    }

    this.server.end();
};

Socket.prototype.disconnect = Socket.prototype.end;

Socket.prototype.raw = function (message) {
    if (!this.connected) {
        return;
    }

    if (util.isArray(message)) {
        message = message.join(" ");
    }

    if (message.indexOf('\n') !== -1) {
        throw new Error('Newline detected in message. Use multiple raws instead.');
    }

    this.server.write(message + '\n', 'ascii');
};

Socket.prototype.isConnected = function () {
    return this.connected;
};


Socket.prototype.getRealName = function () {
    return this._realname;
};


Socket.prototype.onConnect = function (handler) {
    this.server.on('connect', handler.bind(this));
};

Socket.prototype.onDisconnect = function (handler) {
    this.server.on('close', handler.bind(this));
};

Socket.prototype.toString = function () {
    return '[Object IRCSocket]';
};

module.exports = Socket;