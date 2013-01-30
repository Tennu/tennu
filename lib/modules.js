/* This class is tightly coupled with the main NRC class.
 * The reason it is located in its own class and not the NRC class is to
 * keep the modules related code in one place, easier to understand without
 * having all the non-module related code
 */

var Modules = function (bisubscriber) {
    this._subscriber = bisubscriber; // {BiEventSubscriber}
    this._exports = {};              //
    this._loadedNames = [];          // {List<String>}

    this.require(require("../modules/help"));
    this.require(require("../modules/user"));
    this.require(require("../modules/server"));
};

Modules.prototype.require = function (module) {
    var nrc = this._nrc;
    var that = this;

    function listen (event, listener) {
        that._subscriber.on(event, listener);
    }

    // DEPENDENCIES
    if (module.dependencies) {
        module.dependencies.forEach(function (dependency) {
            if (!that.isModule(dependency)) {
                throw new Exception("Module dependency," + dependency +
                  ", not loaded for module" + module.name);
            }
        });
    }

    // NAME
    if (this.isModule(module.name)) {
        throw new Exception("Tried to load same module, " + module.name +
            ", twice.");
    } else if (typeof module.name === "string" && module.name.length === 0) {
        throw new Exception("Module's name property must be a non-empty " +
            "string.");
    }

    this._loadedNames.push(module.name);

    // HANDLERS
    for (var handler in module.handlers) {
        var events = handler.split(" ");
        var listener = module.handlers[handler];

        for (var ix = 0; ix < events.length; ix++) {
            listen(events[ix], listener);
        }
    }

    // EXPORTS
    this._exports[module.name] = module.exports || {};
    this._exports[module.name].name = module.name;
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