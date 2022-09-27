const {createJestConfig} = require('../../../test/config')

module.exports = createJestConfig({
  displayName: require('./package.json').name,
  testEnvironment: 'node',
})
