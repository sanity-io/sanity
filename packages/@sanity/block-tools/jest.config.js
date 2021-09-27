const createConfig = require('../../../jest.config.base')

module.exports = createConfig({
  displayName: require('./package.json').name,
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./test/setup.ts'],
})
