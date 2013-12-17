## Contributions ##

There's a lot of work that can be done.

"I" is Havvy.

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

### Executable to Start Bots ###

```
tennu ./my-server-config.json
```

## Format ##

* Two space indents
* Don't make `new` required for your constructors.
* function fnName (arg, list) {