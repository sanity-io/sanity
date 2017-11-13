/* eslint-disable space-before-function-paren */
module.exports = function(content) {
  if (this.cacheable) {
    this.cacheable()
  }

  this.value = content
  let source = content

  if (typeof source === 'string' && /^\s*#!/.test(source)) {
    source = source.replace(/^\s*#![^\n\r]*[\r\n]/, '')
  }

  return source
}
