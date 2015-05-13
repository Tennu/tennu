[![Travis Status](https://img.shields.io/travis/Tennu/tennu.svg)](https://travis-ci.org/Tennu/tennu) [![NPM Downloads](https://img.shields.io/npm/dm/tennu.svg)](https://npmjs.org/package/tennu) [![Version](https://img.shields.io/npm/v/tennu.svg)](https://npmjs.org/package/tennu) [![ISC Licensed](https://img.shields.io/npm/l/tennu.svg)](http://opensource.org/licenses/ISC) [![Github Issue Count](https://img.shields.io/github/issues/tennu/tennu.svg)](https://github.com/Tennu/tennu/issues) [![Github Stars](https://img.shields.io/github/stars/Tennu/tennu.svg)](https://github.com/Tennu/tennu/stargazers)

Tennu is an IRC bot framework written in Node.js

[![NPM](https://nodei.co/npm/tennu.png?downloads=true&stars=true)](https://nodei.co/npm/tennu/)

----------

## Basic Usage ##

### As a framework ###

See [Getting Started](https://tennu.github.io/documentation/getting-started).

### Library Usage ###

With Tennu as a library, you create an irc client, require your plugins or subscribe to your event listeners, and then connect.

```javascript
var tennu = require('tennu');
var network = require('../config/myNetwork.json'); // See next section
var myClient = tennu.Client(network);
myClient.connect();
```

Before connecting, add listeners to events from irc & users, or load plugins.

```javascript

// Do something when a nick, perhaps yourself, joins a channel
myClient.on('join', function (message) {
    this.say(message.channel, message.actor + " joined!");
});

// Do something when a user emits a command, in this case, join the specified channel.
myClient.on('!join', function (command) {
    this.join(command.args[0]);
});

// Load a plugin.
myClient.initialize(require('./yourPlugin'));

// Or just use a plugin from tennu_plugins/%f or node_plugins/tennu-%f
myClient.use(['admin', 'last-seen']);

myClient.connect();
```

See [https://tennu.github.io/](https://tennu.github.io) for the full documentation.

----------

## Configuration ##

The network configuration object contains all of the properties of
[an irc-socket](https://npmjs.org/package/irc-socket) except for "socket"
plus the following configuration options:

* tls                 - Boolean that if true, upgrades the NetSocket to a TLS socket.
* auth-password       - Password for identifying to services
* nickserv            - Nickname of nickserv service. Defaults to `"nickserv"`.
* command-trigger     - Command character to trigger commands with. By default, `"!"`.
* command-ignore-list - List of commands not to fire a handler for. By default, `[]`. _Example:_ `["commands", "help"]`
* channels            - Array of channels to autojoin. _Example:_ `["#help", "#tennu"]`
* plugins             - An array of plugin names that the bot requires.
* disable-help        - [Deprecated] Boolean that when true, disables the built-in help plugin.
* daemon              - The IRCd you are connecting to. Optional, but useful for "unreal" and "twitch".

The irc-socket configuration values are as follows:

* server          - IRC server to connect to. _Example:_ _irc.mibbit.net_
* port            - Port to connect to. Defaults to 6667.
* nicknames       - Array of nicknames to try to use in order.
* username        - Username part of the hostmask.
* realname        - "Real name" to send with the USER command.
* password        - Password used to connect to the network. Most networks don't have one.
* proxy           - WEBIRC details if your connection is acting as a (probably web-based) proxy.
* capabilities    - IRCv3 capabilities required or wanted. Tennu requires `multi-prefix`.
* connectOptions  - Options passed to the wrapped socket's connect method. Options port and host are ignored.

Other plugins may add additional properties. See their respective documentation.

Configuration objects are JSON encodable.

## Dependency Management ##

The second (optional) parameter to tennu.Client is an object of factories to
replace the factories that the Client uses by default.

* NetSocket
* IrcSocket
* Plugins
* Logger

These functions will always be called as constructors (a.k.a. with `new`).

### Logging ###

The only one you will probably care about is Logger. The object
returned by the Logger function must implement the following methods:

`debug, info, notice, warn, error, crit, alert, emerg`

Base Tennu will only use debug through error, but other plugins and event
emitters may use crit through emerg.

-------------

## Version ##

Tennu follows SemVer. Tennu will have breaking changes in the future, and
many updates will be breaking updates, so expect to see the major version
go up to pretty high numbers. The alternative was to have verisons 0.16.x
at some point, and that's just silly. Tennu is usable today, might as well
call it post-1.0, even if it's not 'feature complete'.

## Event Handling ##

Note: Tennu uses a custom event handler. Listeners are placed at the end of the
node event queue (with setImmediate), insead of happening in the same turn.
Errors are currently logged to console, but otherwise swallowed.

### Response Functionality ###

Commands and Messages that have a channel property take a return value. Currently, the
return value must be a string or array that is then said to the channel the message
originated in.

```javascript
// Simple echobot.
tennu.on('privmsg', function (privmsg) {
    return privmsg.message;
});

// Equivalent to:
tennu.on('privmsg', function (privmsg) {
    tennu.say(privmsg.channel, privmsg.message);
});
```

### Subscribing Options ###

See [Subscriber Plugin docs](https://tennu.github.io/plugin/subscriber)

Subscribing to events in Tennu is more flexible than most event listeners.

You register a single handler on multiple events at once by separating the events with a space,
for example `client.on("x y", fn)` is equivalent to `client.on('x', fn); client.on('y', fn)`. Furthermore, an object
can be passed, where each key is passed as the first parameter and its value, the second.

```javascript
// Examples

on("irc_event", listener)
on("!user-command", listener)
on("join quit", listener)
on({
    "part": part_listener,
    "join": join_listener,
    "!hi !bye": talk_listener
})
```

You can also unsubscribe non-once message events with `off`, taking the same parameters as `on`.

### Listener Parameters ###

Listeners are passed either a message or command object.

#### Message ####

Messages are passed by irc events.

Messages are immutable, as are their args. Make sure to copy the args array before trying to manipulate it.

All messages have the following fields:

* prefix     - The prefix is either a hostmask of the format "nickname!username@hostname", or the server you are connected to.
* command    - Message command type. For example, 'privmsg' or 'nick'.
* params     - Array of sent parameters.
* tags       - IRC3 tags sent with message.

Some messages have extended information. See
[Message Properties](http://tennu.github.io/documentation/api/message-properties).

#### Command ####

Commands are passed for user commands.

Commands are an extension of Messages with the command type of 'privmsg'.
They have all properties, plus the following properties:

* args       - Array of words after the command name.
* command    - The command name.

For example, a command of "!do-it ARG1 ARG2" will have args be ["ARG1", "ARG2"] and command be 'do-it'.

--------

## Actions ##

All of the following are methods on Tennu that can be used once connected.

### say(channel, message) ###

* channel is either a channel ("#chan") or a user ("nick").
* message is either a string or array of strings. Given an array, say each
individual element on its own line.

Has the bot say the message(s) to the specific channel/user.

```javascript
/* Output (IRC)
(botnick) This is a message!
*/
tennu.say('#example', "This is a message!");

/* Output (IRC)
(botnick) Hi there.
(botnick) Bye there.
*/
tennu.say('#example', ["Hi there.", "Bye there."]);
```

### act(channel, message) ###

As per say, but as an action (/me)

```javascript
/* Output (IRC)
botnick does something!
*/
tennu.act('#example', "does something!");
```

### ctcpRequest(channel, tag, message) ###

```javascript
tennu.ctcpRequest('havvy', 'PING', 'ping message');
```

### ctcpRespond(channel, tag, message) ###

```javascript
tennu.ctcpRespond('Havvy', 'VERSION', 'Tennu v4.2.0 (https://tennu.github.io)');
```

### nick(newNick) ###

Change the bots nickname.

### join(channel) ###

Joins the specified channel.

```javascript
tennu.join("#tennu");
tennu.join("#keyed-channel channel-key");
tennu.join("#chan1,#chan2");
tennu.join("0"); // Part all channels.
```

### part(channel, reason) ###

Parts the specified channel with the given reason.

### quit(reason) ###

Quits the server with the given reason.

### whois(users, server) ###

Server is optional, and you'll probably not need it. Look at RFC 1459 for
what benefit it gives you.

users is either a string or an array of strings.

### userhost(users) ###

Retrieves the userhost of the user(s).

### raw(message) ###

For actions that are lacking a command, you can use raw to perform them.
You must either pass an array of arguments (and the multiword argument must
be in a single index without the colon) or pass the full string.

If you find yourself using raw(), please file an issue.

### rawf(format, args...) ###

As raw(message), but the arguments are passed through util.format() first.

--------

## Plugin System ##

Tennu has its own (optional to use) plugin system.
You can read about it at https://github.com/havvy/tennu-plugins/.

You may access the plugin system's methods via the Client.plugins property
or by using one of the following methods:

* client.require()
* client.getPlugin()
* client.getRole()
* client.use()
* client.initializePlugin()
* client.isPluginInitializable()

### Creating Your Own Plugins ###

See [Creating Your Own Plugins](https://github.com/Havvy/tennu/blob/master/doc/creating-plugins.md).

See [Getting Started](http://tennu.github.io/documentation/getting-started).

### Built-In Plugins ###

See [Plugins documentation](https://tennu.github.io/plugins).

## Command Line Utility

Tennu comes with a command line utility for starting Tennu bots with configuration
located in a JSON file. The executable is called "tennu".

Usage:

```bash
tennu config.json
```

The tennu command takes two optional argument, -v (--verbose) and -d (--debug),
for adding a Logger that logs all non-debug messages to the console. Add `-d` to
also log debug messages.

## Contributing ##

See the contributors.md file for specific ways you can help, if you're just
looking for any way to help.

### Directory Structure ###

The `lib`, `tennu_plugins`, `bin`, and `test` directories are all auto-generated files,
with the actual source in subdirectories in the `src` directory.

The `bin` directory contains the executables that the package provides. Right now this
is only the 'tennu' program described in the Command Line Utility section.

The `examples` directory contains example bots, which may or may not work.

### Tests ###

```
npm test
```

This command will rebuild the test files and then run the test suite.

Between all projects (tennu, tennu-plugins, irc-socket, after-events,
prefix-event-emitter), there are over 200 tests, but more are always
appreciated, especially if they are failing with an actual bug. ;)

### Building Files ###

```
npm run build
```

Tennu is written using the Sweet.js dialect of JavaScript. If you've never
used it, it is just JavaScript with macros. But because it's not vanilla JS,
a build step is used.

## See Also ##

* [Tennu's Website](https://tennu.github.io/)
* [IRC Specifications and other helpful tables](https://www.alien.net.au/irc/)
* [IRC Wiki](http://www.irc-wiki.org/)
