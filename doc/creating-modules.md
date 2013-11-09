## Creating a Module ##

Here's a simple workflow for creating modules.

Tennu modules are pretty easy to create. First, pick a name.
If this module is it's own node module, name it `tennu-<module name>`.

Start with this template.

```javascript

return function (tennu) {
    return {
        dependencies: [],
        exports: {
            help: "Your help messages here.";
        },
        handlers: {
            "!command" : function (command) {

            },

            "privmsg" : function (message) {

            }
        }
    };
};
```

2. For any other modules you depend on, put them in the dependency array.
3. Figure out what your interface to the module is, and stub out the handlers for it.
4. Write out the help property of the exports. See help-format.txt in this directory for the format.
5. Make your handlers work. When they need access to the client, use the closure created in the module constructor.

Don't cache the tennu client outside of the function it is passed in. This can cause a clash if you have the same node program opening multiple clients.
