const baseConfig = require('../../../jest.config.base')

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...baseConfig,
  displayName: require('./package.json').name,
  testEnvironment: 'node',
}
