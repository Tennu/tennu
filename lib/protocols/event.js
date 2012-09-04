/**
 * @author Irakli Gozalishvili
 * @see http://jeditoolkit.com/2012/03/21/protocol-based-polymorphism.html
 */

var protocol = require('protocol').protocol
var Event;

// Defining a protocol for working with an event listeners / emitters.
module.exports = Event = protocol({
  // Function on takes event `target` object implementing
  // `Event` protocol as first argument, event `type` string
  // as second argument and `listener` function as a third
  // argument. Optionally forth boolean argument can be
  // specified to use a capture. Function allows registration
  // of event `listeners` on the event `target` for the given
  // event `type`.
  on: [ protocol, String, Function, [ Boolean ] ],

  // Function allows registration of single shot event `listener`
  // on the event `target` of the given event `type`.
  once: [ protocol, 'type', 'listener', [ 'capture=false' ] ],

  // Unregisters event `listener` of the given `type` from the given
  // event `target` (implementing this protocol) with a given `capture`
  // face. Optional `capture` argument falls back to `false`.
  off: [ protocol, 'type', 'listener', [ 'capture=false'] ],

  // Emits given `event` for the listeners of the given event `type`
  // of the given event `target` (implementing this protocol) with a given
  // `capture` face. Optional `capture` argument falls back to `false`.
  emit: [ protocol, 'type', 'event', [ 'capture=false' ] ]
})

// Default implementation.
on = Event.on

// Weak registry of listener maps associated
// to event targets.
var map = WeakMap()

// Returns listeners of the given event `target`
// for the given `type` with a given `capture` face.
function getListeners(target, type, capture) {
  // If there is no listeners map associated with
  // this target then create one.
  if (!map.has(target)) map.set(target, Object.create(null))

  var listeners = map.get(target)
  // prefix event type with a capture face flag.
  var address = (capture ? '!' : '-') + type
  // If there is no listeners array for the given type & capture
  // face than create one and return.
  return listeners[address] || (listeners[address] = [])
}

Event(Object, {
  on: function(target, type, listener, capture) {
    var listeners = getListeners(target, type, capture)
    // Add listener if not registered yet.
    if (!~listeners.indexOf(listener)) listeners.push(listener)
  },
  once: function(target, type, listener, capture) {
    on(target, type, listener, capture)
    on(target, type, function cleanup() {
      off(target, type, listener, capture)
    }, capture)
  },
  off: function(target, type, listener, capture) {
    var listeners = getListeners(target, type, capture)
    var index = listeners.indexOf(listener)
    // Remove listener if registered.
    if (~index) listeners.splice(index, 1)
  },
  emit: function(target, type, event, capture) {
    var listeners = getListeners(target, type, capture).slice()
    // TODO: Exception handling
    while (listeners.length) listeners.shift().call(target, event)
  }
});

//Implementation for EEs.

var EventEmitter = require('events').EventEmitter

EventProtocol(EventEmitter, {
  on: function(target, type, listener, capture) {
    target.on(type, listener)
  },
  once: function(target, type, listener, capture) {
    target.once(type, listener)
  },
  off: function(target, type, listener, capture) {
    target.removeListener(target, type)
  },
  emit: function(target, type, event, capture) {
    target.emit(type, event)
  }
})
