nrc, or Node Relay Chat, is am implementation of an IRC bot using Node.js.

To use, add nrc to your node_modules directory and then require it.

API documenation will be here at some point.

----------

## Network Configuration ##

It is suggested that your static network configuration objects go in _/config/%NETWORK%.json_.

A network configuration object has the following properties:

* server   - IRC server to connect to. _Example:_ _irc.mibbit.net_
* nick     - Nickname the bot will use. *Required*
* user     - Username the bot will use. *Required*
* port     - Port to connect to. Defaults to 6667.
* password - Password for identifying to services. Useless without nickserv option.
* nickserv - Nickname for nickserv service. Useless without password option.
* trigger  - Command character to trigger commands with.

-------------

## Value Objects ##

There are three value objects in this module, accessible via 

* require('nrc').Message
* require('nrc').Command
* require('nrc').Hostmask

### Message ###

A message is emitted by an nrc.NRC object.

A message has the following fields.

* receiver   - Receiver of the message. Usually the user of the module.
* prefix     - If an IRC message starts with a :, the first word is called the prefix.
* sender     - Sender of the message. Usually a Hostmask.
* type       - Type of message. For example, 'privmsg' or 'quit'.
* name       - Alias for type.
* parameters - Array of sent parameters.
* actor      - [join, part, privmsg, quit, nick] User performing the action.
* channel    - [join, part, privmsg, 353] Channel the action is performed in.
* isQuery    - [privmsg] True if message sent in a query.
* reason     - [quit] Quit reason.
* newNick    - [nick] New nick for the user changing nick.
* users      - [353] List of users in channel.

Constructor: String *message*, Object *receiver*

### Command ###

A command is emitted by an nrc.Commander object.

A command has the following fields:

* sender  - Sender of the command.
* params  - Parameters of the command.
* channel - Channel the command was sent through.
* name    - Name of command. Also what the command is emitted as.
* isQuery - True if message sent in a query.

Constructor: String *sender*, String *msg*, String *channel*, boolean *isQuery*
