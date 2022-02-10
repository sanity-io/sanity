/* eslint-disable no-var */
const evtPoly = require('event-source-polyfill')

module.exports =
  typeof window === 'undefined' || !window.EventSource
    ? // Use polyfill in non-browser/legacy environments
      evtPoly.EventSourcePolyfill
    : // Use native EventSource when we can
      window.EventSource
