'use strict'

const {createJestConfig} = require('../../../test/config.cjs')

const PTE_E2E = process.env.PTE_E2E

if (!PTE_E2E) {
  module.exports = createJestConfig({
    displayName: require('./package.json').name,
    modulePathIgnorePatterns: ['<rootDir>/e2e-tests'],
  })
  return
}

// eslint-disable-next-line no-console
console.info('Running collaborate editing tests for the Portable Text Editor')

module.exports = createJestConfig({
  displayName: require('./package.json').name,
  globalSetup: '<rootDir>/e2e-tests/setup/globalSetup.ts',
  globalTeardown: '<rootDir>/e2e-tests/setup/globalTeardown.ts',
  setupFilesAfterEnv: ['<rootDir>/e2e-tests/setup/afterEnv.ts'],
})
