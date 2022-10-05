'use strict'

const {createJestConfig} = require('../../../test/config.cjs')

module.exports = createJestConfig({
  displayName: require('./package.json').name,
  globalSetup: '<rootDir>/test/shared/globalSetup.ts',
  globalTeardown: '<rootDir>/test/shared/globalTeardown.ts',
  rootDir: __dirname,
  setupFilesAfterEnv: ['<rootDir>/test/shared/setupAfterEnv.ts'],
  slowTestThreshold: 60000,
  testEnvironment: 'node',
  testTimeout: 30000,
})
