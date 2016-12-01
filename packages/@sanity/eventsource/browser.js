/* eslint-disable no-var */
var evs = require('eventsource-polyfill/dist/eventsource')
module.exports = window.EventSource || evs.EventSource
