const createConfig = require('../../../createJestConfig')

module.exports = createConfig({
  displayName: require('./package.json').name,
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./test/setup.ts'],
})
