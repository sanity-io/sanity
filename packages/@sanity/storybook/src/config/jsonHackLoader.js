/* eslint-disable import/no-commonjs */

// Seems to be some double parsing going on somewhere.
// This hacks around the issue by turning the JS into JSON again
module.exports = function jsonHackLoader(input) {
  this.cacheable()
  return input.replace(/^module\.exports = /, '')
}
