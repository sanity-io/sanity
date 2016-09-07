const tap = require('tap')

module.exports = function test(name, options, testFn) {
  if (typeof options === 'function') {
    testFn = options
    options = {}
  }
  tap.test(name, Object.assign({}, {autoend: true}, options), testFn)
}
