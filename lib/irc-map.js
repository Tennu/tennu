var lowercase = function (string, encoding) {
    switch (encoding) {
        case "ascii":
            return string.toLowerCase();
        case "strict-rfc1459":
            return string.replace('[', '{').replace(']', '}').replace('\\', '|').toLowerCase();
        case "rfc1459":
            return string.replace('[', '{').replace(']', '}').replace('\\', '|').replace('^', '~').toLowerCase();
        default:
            throw new Error("Unknown encoding for IRC Map.");
    }
}

var IrcMap = function IrcMap (encoding) {
    var map = Object.create(IrcMap.methods);
    map.impl = Object.create(null);
    map.encoding = encoding;
    lowercase("", encoding); // Test the encoding is valid.
    return map;
};

IrcMap.methods = {
    get: function (key) {
        return this.impl[lowercase(key, this.encoding)];
    },

    set: function (key, value) {
        this.impl[lowercase(key, this.encoding)] = value;
    },

    has: function (key) {
        return Object.hasOwnProperty.call(this.impl, lowercase(key, this.encoding));
    },

    keys: function () {
        return Object.keys(this.impl);
    },

    values: function () {
        return Object.keys(this.impl).map(function (key) {
            return this.impl[key];
        };
    },

    items: function () {
        return Object.keys(this.impl).map(function (key) {
            return [key, this.impl[key]];
        });
    },

    forEach: function (fn) {
        Object.keys(this.impl).forEach(function (key) {
            fn(key, this.impl[key], this);
        });
    },

    "delete": function (key) {
        return delete this.impl[lowercase(key, this.encoding)];
    },

    clear: function () {
        this.impl = Object.create(null);
    },

    get size: function () {
        return Object.keys(this.impl).length;
    },

    toString: function () {
        return '[Object IrcMap]';
    }
};

module.exports = IrcMap;