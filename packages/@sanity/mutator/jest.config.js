const createConfig = require('../../../jest.config.base')

module.exports = createConfig({
  displayName: require('./package.json').name,
})
