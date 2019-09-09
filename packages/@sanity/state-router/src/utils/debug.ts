const PREFIX = 'state-router'
export let debug = function(...args) {
  if ((process.env.DEBUG || '').includes(PREFIX)) {
    debug = require('debug')(PREFIX)
    debug(...args)
  }
}
