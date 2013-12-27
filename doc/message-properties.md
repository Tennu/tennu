## Message Properties

Note: If you would like to improve Tennu, adding message extensions is easy.

### All Messages

* receiver   - Receiver of the message. A reference to the Client object.
* prefix     - The prefix is either a hostmask of the format "nickname!username@hostname", or the server you are connected to.
* command    - Message command type. For example, 'privmsg' or 'nick'.
* params     - Array of sent parameters.
* tags       - IRC3 tags sent with message.

### Messages With Hostmask Prefixes

If the message has a hostmask as a prefix, then the `hostmask` property will
be set to an object with three properties:

* nickname
* username
* hostname

Otherwise, this property will be null.

### `nickname` Property

Most messages have a `nickname` property.

For messages that have a hostmask as a prefix, the `nickname` is an alias to `message.hostmask.nickname`.

### `channel` Property

Messages that happen in a specific channel have a `channel` property.

The channel is normalized to lower case.

### `replyname` Property

Numerics that are listed on this article have this property. It is the name given to the numeric
by [alien.net.au](https://www.alien.net.au/irc/irc2numerics.html). These messages are also emitted by the
value of their reply name.

### PRIVMSG and NOTICE

* isQuery - Whether or not the message was sent directly to you, or to a channel.
* channel - In the case of a query, the channel is the nickname of the user who sent the message.
* message - The message, stripped of mIRC color codes and trimmed.

### PART and QUIT

* reason - The user-given reason for the action.

### KICK

* kicked - The user who was kicked.
* kicker - The user who performed the kick.

### NICK

* old - The nickname the user was using.
* new - The nickname the user is now using.

### 307

* replyname - RPL_WHOISREGNICK

### 311

* replyname - RPL_WHOISUSER
* nickname - Nickname of user
* username - Username of user
* hostname - Hostname of user
* realname - Realname (or gecos) of user
* hostmask - Hostmask of user

Note: The prefix is the server you are on.

### 312

* replyname - RPL_WHOISSERVER
* server - Server that the user is on.
* serverInfo - Arbitrary information about the server.

### 317

* replyname - RPL_WHOISIDLE
* seconds - Integral number of seconds since user went idle.
* since - Unix timestamp of last message sent by user


### 318

* replyname - RPL_ENDOFWHOIS

### 319

* replyname - RPL_WHOISCHANNELS

Note: There may eventually be a channels property. For now, you can
get them at message.params[2]. They have a format of:

```
<user power sigil>?<channel type sigil><channel name>
```

### 330

* replyname - RPL_WHOISLOGGEDIN
* identifiedas - Services nickname the user is identified to.

### 378

* replyname - RPL_WHOISHOST
* hostmask - Unparsed hostmask of the user.
* ip - Unparsed IP of the user.

### 401

* replyname - ERR_NOSUCHNICK
