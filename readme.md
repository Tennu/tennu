nrc, or Node Relay Chat, is am implementation of an IRC bot using Node.js.

To use, add nrc to your node_modules directory and then require it.

API documenation will be here at some point.

----------

## Network Configuration ##

It is suggested that your network configuration objects go in _/config/%NETWORK%.json_.

A network configuration object has the following properties:

* server   - IRC server to connect to. _Example:_ _irc.mibbit.net_
* nick     - Nickname the bot will use. *Required*
* user     - Username the bot will use. *Required*
* port     - Port to connect to. Defaults to 6667.
* password - Password for identifying to services. Useless without nickserv option.
* nickserv - Nickname for nickserv service. Useless without password option.