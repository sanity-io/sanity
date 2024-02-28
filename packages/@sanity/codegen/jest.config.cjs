'use strict'

const {createJestConfig} = require('../../../test/config.cjs')

module.exports = createJestConfig({
  displayName: require('./package.json').name,
  testEnvironment: 'node',
  transformIgnorePatterns: ['node_modules/(?!(uint8array-extras)/)'],
})
