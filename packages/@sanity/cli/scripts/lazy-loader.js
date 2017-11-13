/* eslint-disable space-before-function-paren */
module.exports = function(content) {
  if (this.cacheable) {
    this.cacheable()
  }

  this.value = content

  const nonLazy = content.replace(/ = lazyRequire\(/g, ' = () => require(')
  const withoutLazy = nonLazy.replace(/\n.*?lazyRequire\d* = .*?\n/g, '')

  return withoutLazy
}
