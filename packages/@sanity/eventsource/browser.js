/* eslint-disable no-var */
var evs = require('@rexxars/eventsource-polyfill')

module.exports = window.EventSource || evs.EventSource
