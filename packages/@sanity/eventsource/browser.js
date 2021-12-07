/* eslint-disable no-var */
var evs = require('@rexxars/eventsource-polyfill')

module.exports =
  typeof window === 'undefined' || !window.EventSource
    ? // Use polyfill in non-browser/legacy environments
      evs.EventSource
    : // Use native EventSource when we can
      window.EventSource
