[![Build Status](https://travis-ci.org/Tennu/tennu.png?branch=master)](https://travis-ci.org/Tennu/tennu)

Tennu is an IRC bot framework written in Node.js

[![NPM](https://nodei.co/npm/tennu.png?downloads=true&stars=true)](https://nodei.co/npm/tennu/)

----------

## Basic Usage ##

With Tennu, you create an irc client, require your plugins or subscribe to your event listeners, and then connect.

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
myClient.initialize(require('./yourModule'));

// Or just use a plugin from tennu_plugins/%f or node_plugins/tennu-%f
myClient.use(['admin', 'last-seen']);

myClient.connect();
```

See [https://tennu.github.io/](tennu.github.io) for the full documentation.

----------

## Configuration ##

A network configuration object has the following properties:

* server          - IRC server to connect to. _Example:_ _irc.mibbit.net_
* port            - Port to connect to. Defaults to 6667.
* secure          - Use a TLS socket (Throws away the NetSocket)
* ipv6            - Whether you are connecting over ipv6 or not.
* localAddress    - See net.Socket documentation. ;)
* capab           - IRC3 CAP support. (Untested)
* password        - Password for IRC Network (most networks do not have a password)
* nickname        - Nickname the bot will use. Defaults to "tennubot"
* username        - Username the bot will use. Defaults to "user"
* realname        - Realname for the bot. Defaults to "tennu v0.3"
* auth-password   - Password for identifying to services.
* nickserv        - Nickname of nickserv service. Defaults to "nickserv".
* command-trigger - Command character to trigger commands with. By default, '!'.
* channels        - Array of channels to autojoin. _Example:_ ["#help", "#tennu"]
* plugins         - An array of plugin names that the bot requires.
* disable-help    - Disables the built-in help plugin.

Other plugins may add additional properties.

Configuration objects are JSON encodable.

## Dependency Management ##

The second (optional) parameter to tennu.Client is an object of factories to
replace the factories that the Client uses by default.

* NetSocket
* IrcSocket
* MessageHandler
* CommandHandler
* Plugins
* BiSubscriber
* Logger

These functions will always be called as constructors (with `new`).

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

### Respond Functionality ###

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

Subscribing to events in Tennu is more flexible than most event listeners.

You register a single handler on multiple events at once by separating the events with a space,
for example `.on("x y", fn)` is equivalent to `.on('x', fn); .on('y', fn)`. Furthermore, an object
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

You can also unsubscribe non-once events with `off`, taking the same parameters as `on`.

### Listener Parameters ###

Listeners are passed either a message or command object.

#### Message ####

Messages are passed by irc events.

Messages are immutable, as are their args. Make sure to copy the args array before trying to manipulate it.

All messages have the following fields:

* receiver   - Receiver of the message. A reference to the Client object.
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

These methods are also available on the client's 'out' property.
In Tennu 0.9.0, the 'out' property will go away, and the 'actions' plugin
will export these methods.

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

### ctcp(channel, type, message) ###

```javascript
tennu.ctcp('havvy', 'ping', 'PINGMESSAGE');
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
* client.getModule()
* client.getRole()
* client.use()
* client.initializePlugin()
* client.isPluginInitializable()

### Creating Your Own Plugins ###

See [Creating Your Own Plugins](https://github.com/Havvy/tennu/blob/master/doc/creating-plugins.md).

See [Getting Started](http://tennu.github.io/documentation/getting-started).

### Built-In Modules ###

Only the help plugin is currently fully implemented.

#### help ####

Handles the two commands "!commands" and "!help".

See [Help Module Documentation](https://tennu.github.io/plugins/help).

If you don't want this functionality, set `disable-help` to `true` in your configuration object.

#### channels ####

Unimplemented. Currently being worked on by Dan_Ugore.

#### users ####

This plugin has a single method exported: isIdentifedAs(nickname, nickname_identified, callback)

See [User Module Documentation](https://tennu.github.io/plugins/user).

#### server ####

Information about the server. For now, the only thing this plugin offers is a
capabilities map listing the information from the 005 raw numeric.

See [Server Plugin Documentation](https://tennu.github.io/plugins/server).

```javascript
var server = tennu.use("server");
console.log(util.inspect(server.capabilities));
```

## Command Line Utility

Install Tennu globally, and you'll gain access to the `tennu` command line tool.

```bash
> pwd
/home/you/your-tennubot
> ls
node_plugins/ tennu_plugins/ config.json
> tennu config.json
```

The tennu command takes two optional argument, -v (--verbose) and -d (--debug),
for adding a Logger that logs to the console (info level and above without -d).

You can also use the tennu command inside your npm scripts when Tennu is installed
locally, and if you are distributing the bot, this is a better option.

## Contributing ##

See the contributors.md file for specific ways you can help, if you're just
looking for any way to help.

### Directory Structure ###

The `lib`, `tennu_plugins`, and `test` directories are all auto-generated files,
with the actual source in subdirectories in the `src` directory.

The `bin` directory contains the executables that the package provides. Right now this
is only the 'tennu' program described in the Command Line Utility section.

The `examples` directory contains example bots, mainly used for integration testing.

The `doc` directory contains documents written by Havvy. They're mostly being phased out
for having the documentation on [https://tennu.github.io/](https://tennu.github.io/).

### Tests ###

```
npm test
```

This command will rebuild the test files and then run the test suite.

Between all projects (tennu, tennu-plugins, irc-socket, after-events),
there are over 100 tests, but more are always appreciated, especially
if they are failing with an actual bug. ;)

### Building Files ###

```
npm run-script build
```

Tennu is written using the Sweet.js dialect of JavaScript. If you've never
used it, it is just JavaScript with macros. But because it's not vanilla JS,
a build step is used.

## See Also ##

* [Tennu's Website](https://tennu.github.io/)
* [IRC Specifications and other helpful tables](https://www.alien.net.au/irc/)
* [IRC Wiki](http://www.irc-wiki.org/)
