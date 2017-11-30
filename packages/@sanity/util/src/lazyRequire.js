const dynamicRequire = require('./dynamicRequire')

module.exports = id => (...args) => {
  const mod = dynamicRequire(id)
  return mod(...args)
}
