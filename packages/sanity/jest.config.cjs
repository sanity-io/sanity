'use strict'

const {createJestConfig} = require('../../test/config.cjs')

module.exports = createJestConfig({
  displayName: require('./package.json').name,
  globalSetup: '<rootDir>/test/setup/global.ts',
  setupFiles: ['<rootDir>/test/setup/environment.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/setup/afterEnv.ts'],
  modulePathIgnorePatterns: ['<rootDir>/playwright-ct'],
})
