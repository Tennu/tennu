/**
 * Given the result of an indexOf, determines whether or not the index was found.
 * @param {number} indexOfResult
 * @return {boolean} Whether or not result is a found result.
 */
var indexOf = function (string, substring) {
  return string.indexOf(substring) === -1 ? null : string.indexOf(substring);
};

/**
 * @namespace
 */
var parsers = {};

/**
 * Parses a hostmask, returning the part of the hostmask requested.
 * @param {string} hostmask A hostmask of the form nick!user@host
 * @param {string} part One of ["nick", "user", "host"].
 * @public
 */
parsers.hostmask = function (hostmask, part) {
  var nickEnd = hostmask.indexOf("!");
  var userEnd = hostmask.indexOf("@");

  switch (part) {
    case "nick":
      return hostmask.slice(0, nickEnd);
    case "user":
      return hostmask.slice(nickEnd + 1, userEnd);
    case "host":
      return hostmask.slice(userEnd + 1);
    default:
      throw new RangeError("this method only accepts 'nick', 'user', or 'host' for the part to extract.");
  }
};

/**
 * Parses a mode, returning a modeChange object.
 * Does not current work with mode parameters.
 *
 * @public
 * @param modeString A mode string such as +ao-Re nick1!user@host1 nick2!user@host2 nick3!user@host3
 * @todo Parse modes that take parameters, like +aohvk for channels.
 */
parsers.mode = function (modeString) {
  var minus, space, ix, modes = {}, pos = [];

  if (!modeString) {
    konsole.error("Given empty modeString");
    return modes;
  };

  plus = indexOf(modeString, "+");
  minus = indexOf(modeString, "-");
  space = indexOf(modeString, " ");

  if (plus) {
    for (ix = 1; ix < (minus || space || modeString.length); ix++) {
      modes[modeString[ix]] = {sign : "+"};
      pos.push(modeString[ix]);
    }
  }

  if (minus) {
    for (ix = minus + 1; ix < (space || modeString.length); ix++) {
      modes[modeString[ix]] = {sign : "-"};
      pos.push(modeString[ix]);
    }
  }

  return modes;
};

/*
 * @param {string} params Everything after the first space of the command
 * @return {string[]} Parameters broken into an array, properly handling
 * the trailing case.
 */
parsers.params = function (params) {
  var trailing, middle, trailingIx;

  trailingIx = params.indexOf(" :");

  if (params[0] === ":") {
    return [params.slice(1)];
  } else if (trailingIx === -1) {
    return params.split(" ");
  } else {
    trailing = params.slice(trailingIx + 2).trim();
    middle = params.slice(0, trailingIx).split(" ");
    middle.push(trailing); //push returns the length property
    return middle;
  }
};

/*
 * Takes a raw message and turns it into an event object.
 * @param {string} Non-null message for the server.
 * @return {Object} ircmsgEvent for the message.
 */
parsers.raw = function (message) {
  var event = { type : "irc" }, ixa = -1, ixb = -1;

  if (message[0] === ":") {
    ixa = message.indexOf(" ");
    event.prefix = message.slice(1, ixa);
    event.pretype = parsers.prefix(event.prefix);
  }

  ixb = message.indexOf(" ", ixa + 1);

  event.name = message.slice(ixa + 1, ixb).toLowerCase();
  event.params = parsers.params(message.slice(ixb + 1));

  return event;
};

module.exports = parsers;