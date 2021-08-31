const baseConfig = require('../../../jest.config.base')

module.exports = {
  ...baseConfig,
  displayName: require('./package.json').name,
  testEnvironment: 'node',
}
