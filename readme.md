Tennu is an IRC bot framework written in Node.js
Current Status: Interface tweaks; deep freezing structs.

----------

## Basic Usage ##

With Tennu, you create an irc client, inject your logic into it 
with modules or basic event listeners, and then connect.

```javascript
var tennu = require('tennu');
var network = require('../config/myNetwork.json'); // See next section
var myClient = tennu.Client(network);
myClient.connect();
```

Before connecting, add listeners to events from irc & users, or load modules.

```javascript

// Do something when a nick, perhaps yourself, joins a channel
myNetwork.on('join', function (message) {
	this.say(message.channel, message.actor + " joined!");
});

// Do something when a user emits a command, in this case, hello.
myNetwork.on('!hello', function (command) {
	this.say(command.channel, 'world');
});

// Load a moudle.
// The require function is from node, and the method is from Tennu.
myNetwork.require(require('./yourModule'));

myNetwork.connect();
```

----------

## Network Configuration ##

A network configuration object has the following properties:

* server      - IRC server to connect to. _Example:_ _irc.mibbit.net_
* nick        - Nickname the bot will use. Defaults to "tennubot"
* user        - Username the bot will use. Defaults to "user"
* realname    - Realname for the bot. Defaults to "tennu v0.3"
* port        - Port to connect to. Defaults to 6667.
* password    - Password for identifying to services.
* nickserv    - Nickname for nickserv service. Defaults to "nickserv".
* trigger     - Command character to trigger commands with. By default, '!'.
* channels    - Array of channels to autojoin. _Example:_ ["#help", "#tennu"]
* modules     - An array of module names that the bot requires.

Static network configuration objects can go in _./config/%NETWORK%.json_
(relative to your project) and then required in via node.

-------------

## Listeners ##

Tennu's event listeners (on and once) take listeners in a multitude of ways.

```javascript
on("irc_event", listener)
on("!user_command", listener)
on("join quit", listener)
on({
    "part": part_listener,
    "join": join_listener,
    "!hi !bye": talk_listener
})
```

If the first character of the event is an '!', then is is a user command. Otherwise,
it is an irc event being listened too. If multiple events share the same
listener, you can seperate them with a space. If there are multiple listeners
you want to listen to, you can pass an object where the property names are the
events to listen to and the property values are the listeners.

Listeners are passed either a message or command object.

### Message ###

Messages are passed by irc events.

Messages are immutable, as are their args. Make sure to copy the args array before trying to manipulate it.

Messages have the following fields. Those that have a list of event types are
only set by messages of that type.

* receiver   - Receiver of the message. The Tennu object in most cases.
* prefix     - If an IRC message starts with a :, the first word is called the prefix.
* sender     - Sender of the message. Usually a Hostmask.
* name       - Message type.
* args       - Array of sent parameters.
* channel    - [join, part, privmsg, 353] Channel the action is performed in.
* isQuery    - [privmsg] True if message sent in a query.
* reason     - [quit] Quit reason.
* newNick    - [nick] New nick for the user changing nick.
* users      - [353] List of users in channel.

### Command ###

Commands are passed for user commands.

Commands are immutable, as are their args. Make sure to copy the args array before trying to manipulate it.

Commands have the following fields.

* sender  - Sender of the command.
* args    - Parameters of the command.
* channel - Channel the command was sent through.
* name    - Name of the command.
* isQuery - True if message sent in a query.

--------

## Actions ##

All of the following are methods on Tennu for doing things once connected.

These methods are also available on the client's 'out' property.

### join(channel) ###

Joins the specified channel.

### part(channel, reason) ###

Parts the specified channel with the given reason.

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

### quit(reason) ###

Quits the server with the given reason.


### whois(users, server) ###

Server is optional, and you'll probably not need it. Look at RFC 1459 for
what benefit it gives you.

users is either a string or an array of strings.

### userhost(users) ###

Retrieves the userhost of the user. 

### _raw(message) ###

Our IrcOutputSocket class does not have all commands. If you need to use one
that is not listed here, you can use the internal _raw method, which takes
the entire message as is as a string, use your own IrcOutputSocket class, or
send in a patch.

--------

## Modules ##

Tennu has its own module system, loosely based off of Node's. You can read
about it at https://github.com/havvy/tennu-modules/.

This is a completely different module system than versions before 0.5.0.
Throw your non-generic modules into tennu_modules of your project,
and note that you export a function that creates the module.

You may access the module system's methods via the Client.modules property
or by using one of the following methods:

* client.require()
* client.exports() [an alias of client.require()]
* client.load()
* client.loaded()

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