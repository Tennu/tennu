/* This class is tightly coupled with the main NRC class.
 * The reason it is located in its own class and not the NRC class is to
 * keep the modules related code in one place, easier to understand without
 * having all the non-module related code
 */

var Listener = require('./listener');

var Modules = function (bisubscriber) {
    this._subscriber = bisubscriber; // {BiEventSubscriber}
    this._exports = {};              // {Map[String, Object]}
    this._loadedNames = [];          // {List<String>}
};

Modules.prototype.require = function (moduleConstructor) {
    var module = new moduleConstructor();
    var that = this;

    function listen (event, listener) {
        that._subscriber.on(event, Listener(listener));
    }

    // BUILD AN EXPORT OBJECT
    module.exports = module.exports || {};

    // NAME
    if (this.isModule(module.name)) {
        throw new Error("Tried to load same module, " + module.name +
            ", twice.");
    } else if (typeof module.name === "string" && module.name.length === 0) {
        throw new Error("Module's name property must be a non-empty " +
            "string.");
    }

    module.exports.name = module.name;

    // DEPENDENCIES
    if (module.dependencies) {
        module.exports.dependencies = {};
        module.dependencies.forEach(function (dependency) {
            if (!that.isModule(dependency)) {
                throw new Error("Module dependency," + dependency +
                  ", not loaded for module" + module.name);
            }

            module.exports.dependencies[dependency] = that.use(dependency);
        });
    }

    // HANDLERS
    for (var handler in module.handlers) {
        var events = handler.split(" ");
        var listener = module.handlers[handler];

        for (var ix = 0; ix < events.length; ix++) {
            listen(events[ix], listener);
        }
    }

    // EXPORTS
    this._loadedNames.push(module.name);
    this._exports[module.name] = module.exports;
};

Modules.prototype.use = function (name) {
    return this._exports[name];
};

Modules.prototype.isModule = function (name) {
    return this._loadedNames.indexOf(name) !== -1;
};

Modules.prototype.getAllModuleNames = function () {
    // Return a copy of the names array.
    return this._loadedNames.slice();
};

Modules.prototype.getAllModuleExports = function () {
    var that = this;
    var exports = {};
    this.getAllModuleNames().forEach(function (name) {
        exports[name] = that._exports[name];
    });
    return exports;
};

module.exports = Modules;