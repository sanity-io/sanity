'use strict'

const {createJestConfig} = require('../test/config.cjs')

module.exports = createJestConfig({
  // ignore performance tests
  testPathIgnorePatterns: ['tests'],
  displayName: require('./package.json').name,
})
