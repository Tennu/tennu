Note: Not every command is extended. The list join, kick, notice, part, privmsg, nick, quit

Messages that happen in a specific channel have the property "channel" with the channel name.

If the message was a query (either via notice or privmsg), the channel property is the nickname of the
person who sent the query, and isQuery will be set to true.

The quit message has the property 'reason'. Eventually the part message will too.

The nick message has the properties 'old' and 'new'.

The kick message has the properties 'kicked' and 'kicker'.

Note: This is a weak part of the framework. If you want to contribute to Tennu, 
this is an easy and helpful place to make Tennu more useful.