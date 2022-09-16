'use strict'

const {createJestConfig} = require('../../../test/config.cjs')

module.exports = createJestConfig({
  displayName: require('./package.json').name,
  testEnvironment: 'node',
  rootDir: __dirname,
  globalSetup: '<rootDir>/test/shared/globalSetup.ts',
  globalTeardown: '<rootDir>/test/shared/globalTeardown.ts',
  slowTestThreshold: 60000,
  testTimeout: 30000,
})
