## Contributions ##

If you want to contribute, you are more than welcome to do so.

Here are a list of some of the things that would be really nice to see
contributions for, though you may also contribute in other ways.

### Message Extensions ###

There's a lot of numerics and commands. Please add extensions, even partially
complete extensions, for any numerics you want to deal with. Pull requests for
these can even be taken without an accompanying test, though those with
tests are even better.

### IrcOutputSocket Commands ###

Tennu is missing many commands from IRC. If you want to add them, please
do so. Just make sure to also add the method wrapper to the client class.

Another feature that is missing is the returning of a Promise when doing
things. For instance, Client.join(chan) should return a Promise that
succeeds when the channel is joined with the topic, names list, and
channel name in the success object with an error case with the numeric
that gives the reason for failure.

### Tests ###

Not everything is tested. If you add a feature, or change something, please
attach to your pull request some tests that show your code is working. Or
if you find a bug, a test case that shows the bug in action would be great.

### Built In Modules ###

Please feel free to write and extend the Server, User, and/or Channel modules.

They should really be the meat of the "IRC" framework, but like most
parts of this framework that are IRC specific, they have been neglected. :(

## Building ##

Tennu is compiled from Sweet.js to ECMAScript. Sweet.js is a superset of
ECMAScript 5 that adds macros. If you don't want to use macros, just write
vanilla JavaScript.

All the source files are located under `/src`.

Just write `npm run build` and the project will be built, usually within
five seconds.

Note that `npm test` will first rebuild the project before running the
tests, so if you are testing, there's no need to run build.

## On Versioning  ##

Tennu follows SemVer like all npm packages should.

While the version is greater than 1.0.0, I, Havvy, don't actually consider
this feature complete, but I'm not working on it as much, and it is stable.

The version number shouldn't really matter that much. Documentation, other
than the changelog, will always focus on the latest version. Should a
major rewrite of Tennu happen, it'll most probably be in another language
(such as Elixir).

Thus, when making a backards incompatible change, if it's possible to
deprecate, deprecate the functionality instead, and then it can be removed
two major releases later. If it's not possible to deprecate, the change
may be put on hold.

That said, do *not* change the version number yourself. Just give a
heads up as to what you are doing so the version can be changed properly.

## Format & Style ##

Indent with four spaces. Not two spaces. Not tabs.

Define functions (both expressions and statements) like this:

```javascript
function fnName (arg, list) {
    // body
}
```

Spaces go before and afer binary operators. For example: `2 + 2`, `(4 + 3) * 2`

Do not use `++` and `--` operators. Use `+= 1` and `-= 1` instead. If
this means adding another statement, so be it.

Tennu is built using Sweet.js, so we have access to macros. Where appropriate,
you may add your own inline macros at the top of a file. You may also use
macro packages for ES6 syntactic sugar, just one hasn't been added yet.
Likewise, you can add in a macro package to remove parenthesis around block
predicates. That just hasn't been added yet.

## Documentation ##

[https://tennu.github.io](Tennu's documentation) should be updated as
necessary. Send a PR to the documentation repo, and it'll be accepted
without question most of the time. There's also no real need to be clean
about your commits to the documentation repo.