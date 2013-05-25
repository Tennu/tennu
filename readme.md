nrc, or Node Relay Chat, is am implementation of an IRC bot using Node.js.

To use, add nrc to your node_modules directory and then require it.

Current Status: Broken. Ask me, and I'll give you a working version.

----------

## Basic Usage ##

```javascript
var nrc = require('nrc');
var network = require('../config/myNetwork.json');
var myNetwork = new nrc.Client(network);
myNetwork.connect();
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
myNetwork.require(require('./yourModule'));

myNetwork.connect();
```

----------

## Network Configuration ##

It is suggested that your static network configuration objects go in _/config/%NETWORK%.json_.

A network configuration object has the following properties:

* server      - IRC server to connect to. _Example:_ _irc.mibbit.net_
* nick        - Nickname the bot will use. Defaults to "nrcbot"
* user        - Username the bot will use. Defaults to "user"
* realname    - Realname for the bot. Defaults to "nrc v0.3"
* port        - Port to connect to. Defaults to 6667.
* password    - Password for identifying to services.
* nickserv    - Nickname for nickserv service. Defaults to "nickserv".
* trigger     - Command character to trigger commands with. By default, '!'.
* channels    - Array of channels to autojoin. _Example:_ ["#help", "#nrc"]
* modules     - An array of strings or objects.
** string     - The file location of the Node module that exports an NRC module.
** object     - Has the following fields. All optional other than 'file'
*** file      - The file location of the Node module that exports an NRC module.
*** config    - Configuration object for the module. Defaults to {}.
*** usepath   - Boolean whether to append module-path to file. Defaults to true.
* module-path - Prefix added to module file locations.

Other modules may require or use more options. Such options will be in

-------------

## Listeners ##

NRC's event listeners (on and once) take listeners in a multitude of ways.

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
If the first character is an '!', then the event is a user command. Otherwise,
it is an irc event being listened too. If multiple events share the same
listener, you can seperate them with a space. If you have multiple listeners
you want to listen to, you can pass an object where the property names are the
events to listen to and the property values are the listeners.

Listeners have their 'this' value set to the NRC object, and are passed either
a message or command object.

### Message ###

Messages are passed by irc events.

Messages have the following fields. Those that have a list of event types are
only set by messages of that type.

* receiver   - Receiver of the message. The NRC object in most cases.
* prefix     - If an IRC message starts with a :, the first word is called the prefix.
* sender     - Sender of the message. Usually a Hostmask.
* type       - Type of message. For example, 'privmsg' or 'quit'.
* name       - Alias for type.
* args       - Array of sent parameters.
* actor      - [join, part, privmsg, quit, nick] User performing the action.
* channel    - [join, part, privmsg, 353] Channel the action is performed in.
* isQuery    - [privmsg] True if message sent in a query.
* reason     - [quit] Quit reason.
* newNick    - [nick] New nick for the user changing nick.
* users      - [353] List of users in channel.

### Command ###

Commands are passed for user commands.

Commands have the following fields.

* sender  - Sender of the command.
* args    - Parameters of the command.
* channel - Channel the command was sent through.
* name    - Name of the command.
* isQuery - True if message sent in a query.

--------

## Actions ##

All of the following are methods on NRC for doing things once connected.

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
nrc.say('#example', "This is a message!");

/* Output (IRC)
(botnick) Hi there.
(botnick) Bye there.
*/
nrc.say('#example', ["Hi there.", "Bye there."]);
```

### act(channel, message) ###

As per say, but as an action (/me)

```javascript
/* Output (IRC)
botnick does something!
*/
nrc.act('#example', "does something!");
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
the entire message as is as a string.

--------

## Modules ##

NRC has its own module system, loosely based off of Node's. Modules are
implemented using the following object structure:

```javascript
{
    name: string,
    dependencies: [string],
    exports: object,
    handlers: {
        "event": function
    }
}
```

* name: Name of module.
* dependencies: Modules that the module requires. The module will not load
if not all the dependencies are met.
* exports: The data accessible to other modules created by this module.
* handlers: Listeners, both for irc events and user events.

For each property in the handlers object, we call nrc.on(name, value).

The exports object is automatically created if not defined or not an object.
The name property of the exports is automatically set to the name of the
module, overwriting any value it otherwise had.

Handler boolean properties are optional, and assumed false if undefined.

### Module Methods ###

NRC has the following methods related to modules.

* require(module) - Loads a module into the bot.
* isModule(name) - True if module with name is loaded.
* use(name) - Returns the exports object of the module with that name or
undefined if the module is not loaded.
* getAllModuleExports() - Returns all the export objects of all loaded modules.
* getAllModuleNames() - Returns all the names of all loaded modules.

### Built-In Modules ###

#### help ####

Sets the user command *help*.

You may add help content for you modules by setting the *help* key on your
module's export. The value is an object, array of strings, or a string, which
will be called a help value.

The object is a map of subitems to more help values. Of special note, the help
value for the item itself is called main.

The array of strings is the lines of help to show the user. If there is only
one line, you may just pass a single string.

Here is an example of a help object.

```javascript
{
    main: "I'm an example module."
    sub1: {
        main: "I'm the sub1 multi-command.",
        x: "I'm the sub1 x command.",
        y: "I'm the sub1 y command.",
    },
    sub2: [
        "I'm the sub2 command.",
        "My help is longer than the others."
    ]
}
```

Assume the module's name is 'example'. Then these will all work and return

* help example >> I'm an example module.
* help sub1 >> I'm the sub1 multi-command.
* help sub1 x >> I'm the sub1 x command
* help sub2 >> I'm the sub2 command. >> My help is longer than the others.

#### channels ####

___Unofficial:___ This module will be official before the 1.0.0 release.

This module is currently disabed.

This module handles keeping track of channel-specific data.

#### users ####

___Unofficial:___ This module will be official before the 1.0.0 release.

This module is currently disabled.

This module handles keeping track of user-specific data.

#### server ####

Information about the server. For now, the only thing this module offers is a
capabilities map listing the information from the 005 raw numeric.

```javascript

var server = nrc.use("server");
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

## Contributions ##

There's a lot of work that can be done.

### Module System ###

The parameters for the modules in the config don't actually do anything. They
need to be implemented.

### Startup ###

As part of an IrcSocket, I want them to take a Startup object (an object that
implements the startup interface, whatever that may be). Right now startup
code is all over the place, and this sucks.

I want this to be able to change (say we have one that implements IRC 3's
CAPABILITIES protocol or one that does WEBIRC) pretty easily.

### Testing ###

I would like to be testing each class in isolation.

With exception to the Client class, which should be tested as integration.

### Built In Modules ###

I don't want to write these, so I've been putting them off. If you want to,
please feel free to write them.

### ChunkedIrcMessageHandler ###

Listens to the IrcMessageHandler, it chunks together list-like replies such
as whois and isupport numerics. For messages that aren't chunked, just pass
them through normally.

### IrcOutputSocket Commands ###

I'm missing most of the commands from IRC. If you want to add them, please
do so. Just make sure to also add the method wrapper to the client class.