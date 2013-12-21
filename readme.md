Tennu is an IRC bot framework written in Node.js

----------

## Basic Usage ##

With Tennu, you create an irc client, require your modules or subscribe to your event listeners, and then connect.

```javascript
var tennu = require('tennu');
var network = require('../config/myNetwork.json'); // See next section
var myClient = tennu.Client(network);
myClient.connect();
```

Before connecting, add listeners to events from irc & users, or load modules.

```javascript

// Do something when a nick, perhaps yourself, joins a channel
myClient.on('join', function (message) {
    this.say(message.channel, message.actor + " joined!");
});

// Do something when a user emits a command, in this case, hello.
myClient.on('!hello', function (command) {
    this.say(command.channel, 'world');
});

// Load a module.
// The require function is from node, and the method is from Tennu.
myClient.require(require('./yourModule'));

myClient.connect();
```

----------

## Network Configuration ##

A network configuration object has the following properties:

* server      - IRC server to connect to. _Example:_ _irc.mibbit.net_
* port        - Port to connect to. Defaults to 6667.
* capab       - IRC3 CAP support. (Untested)
* secure      - Use a TLS socket (Throws away the NetSocket)
* nick        - Nickname the bot will use. Defaults to "tennubot"
* user        - Username the bot will use. Defaults to "user"
* realname    - Realname for the bot. Defaults to "tennu v0.3"
* password    - Password for identifying to services.
* nickserv    - Nickname of nickserv service. Defaults to "nickserv".
* trigger     - Command character to trigger commands with. By default, '!'.
* channels    - Array of channels to autojoin. _Example:_ ["#help", "#tennu"]
* modules     - An array of module names that the bot requires.

Other modules may use additional properties.

Network configuration objects are JSON encodable.

## Dependency Management ##

The second (optional) parameter to tennu.Client is an object of factories to
replace the factories that the Client uses by default.

* NetSocket
* IrcSocket
* IrcOutputSocket
* MessageParser
* ChunkedMessageParser
* CommandParser
* Modules
* BiSubscriber
* Logger

These functions will always be called as constructors (with `new`).

### Logging ###

Of these, the only one you will probably care about is Logger. The object
returned by the Logger function must implement the following methods:

`debug, info, notice, warn, error, crit, alert, emerg`

Base Tennu will only use debug through error, but other modules and event
emitters may use crit through emerg.

-------------

## Event Handling ##

Note: Tennu uses a custom event handler. Listeners are placed at the end of the event queue,
insead of happening right away. Errors are currently logged to console, but otherwise
swallowed.

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

### Listener Parameters ###

Listeners are passed either a message or command object.

#### Message ####

Messages are passed by irc events.

Messages are immutable, as are their args. Make sure to copy the args array before trying to manipulate it.

All messages have the following fields:

* receiver   - Receiver of the message. A reference to the Tennu object.
* prefix     - The prefix is either a hostmask of the format "nickname!username@hostname", or the server you are connected to.
* hostmask   - If the prefix is a hostmask, this will be an object with properties {nickname, username, hostname}.
* command    - Message command type. For example, 'privmsg' or 'nick'.
* params     - Array of sent parameters.

##### Extensions #####

Note: Only the following message command types have extensions: join, kick, notice, part, privmsg, nick, quit

Messages that happen in a specific channel have the property "channel" with the channel name.

If the message was a query (either via notice or privmsg), the channel property is the nickname of the
person who sent the query, and isQuery will be set to true.

The quit message has the property 'reason'. Eventually the part message will too.

The nick message has the properties 'old' and 'new'.

The kick message has the properties 'kicked' and 'kicker'.

Note: This is a weak part of the framework. If you want to contribute to Tennu, 
this is an easy and helpful place to make Tennu more useful.

#### Command ####

Commands are passed for user commands.

Commands are an extension of Messages with the command type of 'privmsg'.
They have all properties, plus the following properties:

* args       - Array of words after the command name.
* command    - The command name.

For example, a command of "!do-it ARG1 ARG2" will have args be ["ARG1", "ARG2"] and command be 'do-it'.

--------

## Actions ##

All of the following are methods on Tennu for doing things once connected.

These methods are also available on the client's 'out' property.

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

### _raw(message) ###

Our IrcOutputSocket class does not have all commands. If you need to use one
that is not listed here, you can use the internal _raw method, which takes
the entire message as is as a string, use your own IrcOutputSocket class, or
send in a patch.

### _rawf(format, args...) ###

[0.8.0]

As _raw(message), but the arguments are passed through util.format() first.

--------

## Module System ##

Tennu has its own module system, loosely based off of Node's. You can read
about it at https://github.com/havvy/tennu-modules/.

You may access the module system's methods via the Client.modules property
or by using one of the following methods:

* client.require()
* client.exports() [an alias of client.require()]
* client.load()
* client.loaded()

### Creating Your Own Modules ###

See [Creating Your Own Modules](https://github.com/Havvy/tennu/blob/master/doc/creating-modules.md)

### Built-In Modules ###

Only the help module is currently implemented.

#### help ####

Sets the command *!help*.

See ./doc/help.md for more information.

#### channels ####

This module handles keeping track of channel-specific data.

#### users ####

This module handles keeping track of user-specific data.

#### server ####

Information about the server. For now, the only thing this module offers is a
capabilities map listing the information from the 005 raw numeric.

```javascript

var server = tennu.use("server");
console.log(util.inspect(server.capabilities));
```

The capabilities object looks like this for the Mibbit network.

```javascript
{
  CMDS: 'KNOCK,MAP,DCCALLOW,USERIP',
  UHNAMES: true,
  NAMESX: true,
  SAFELIST: true,
  HCN: true,
  MAXCHANNELS: '40',
  CHANLIMIT: '#:40',
  MAXLIST: 'b:120,e:120,I:120',
  NICKLEN: '30',
  CHANNELLEN: '32',
  TOPICLEN: '307',
  KICKLEN: '307',
  AWAYLEN: '307',
  MAXTARGETS: '20',
  WALLCHOPS: true,
  WATCH: '128',
  WATCHOPTS: 'A',
  SILENCE: '15',
  MODES: '12',
  CHANTYPES: '#',
  PREFIX: '(qaohv)~&@%+',
  CHANMODES: 'beI,kfL,lj,psmntirRcOAQKVCuzNSMTG',
  NETWORK: 'Mibbit',
  CASEMAPPING: 'ascii',
  EXTBAN: '~,cqnr',
  ELIST: 'MNUCT',
  STATUSMSG: '~&@%+',
  EXCEPTS: true,
  INVEX: true
}
```

## Command Line Utility

Install `Tennu` globally, and you'll gain access to the `tennu` command line tool.

```bash
> pwd
/home/you/your-tennubot
> ls
node_modules/ tennu_modules/ config.json
> tennu config.json
```

The tennu command takes one optional argument, -v (--verbose), for adding a Logger that logs to console.


## Other Objects ##

The following other objects can be obtained from the Tennu module:

* Message
* OutputSocket
* MessageParser
* CommandParser
* Bisubscriber

Documentation for these objects in isolation is currently unavailable.

## See Also ##

* [IRC Specifications and other helpful tables](https://www.alien.net.au/irc/)
* [IRC Wiki](http://www.irc-wiki.org/)