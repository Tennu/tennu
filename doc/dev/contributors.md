## Contributions ##

There's a lot of work that can be done.

From most important to least important:

### Message Extensions ###

There's a lot of numerics and commands. Please add extensions, even partially complete
extensions, for any numerics you deal with.

### IrcOutputSocket Commands ###

Tennu is missing most of the commands from IRC. If you want to add them, please
do so. Just make sure to also add the method wrapper to the client class.

### Tests ###

Either help port tests to Mocha, or add new tests.

(If you do port tests to Mocha, add Mocha to the devDependencies and place them in /test)

### Built In Modules ###

Please feel free to write the Server, User, and/or Channel modules.

### 1.0.0 Release Checklist ###

Getting closer to 1.0.0 would be nice.

### ChunkedIrcMessageHandler ###

Listens to the IrcMessageHandler, it chunks together list-like replies such
as whois and isupport numerics. For messages that aren't chunked, just pass
them through normally.

Not a goal for 1.0.0 though.

## Format ##

* Four space indents
* Favor factories over constuctors. Where you do use a constructor, make
  sure it works without being called in a `new` context.
* `function fnName (arg, list) {`
* Spaces around binary operators. Ex:  `2 + 2`, `(4 + 3) * 2`.
* No harmony features.