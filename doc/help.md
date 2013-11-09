# Help Module #

The Help Module is responsible for a single command: !help <query>. The
module will respond with the associated help stored for that query.

Should no query be given, the query will be presumed to be "help", thus
showing the help message for the help command.

Should the query fail to find the requested topic, the default help not
found message will be shown:

> Help message for selected topic does not exist.

## Adding to the Help System ##

A module may add to the help message database by setting the help key on
their exports objects.

The general form of the value is a dictionary of topics that take a
dictionary of subtopics along with an '*' property for the help message
for that topic itself.

The help message may either be a string or an array of strings for
multiline messages.

For example, here is the help object for a time module:

```javascript
{
    time: {
        '*': [
            "The time module gives time information as requested.",
            "",
            "Subcommands: ",
            "!time at <place>",
            "!time zone <place>",
            "!time between <place> and <place>"
        ],

        // Help messages omitted for brevity.
        at: "...",
        zone: "...",
        between: "..."
    }
}
```

### Simple Represenations ###

Should your topic not have any subtopics, you may use a string or array
directly.

Thus, the 'zone' property in the preceding example is equivalent to
**{ '*': "..." }**.

Should your module only need to respond to the query that is the module's
name, the help value may be just a string or array.

### Tip ###

If your help object is getting unwieldy, shove it into another file, and
require it.