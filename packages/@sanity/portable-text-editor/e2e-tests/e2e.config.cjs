'use strict'

const {createJestConfig} = require('../../../../test/config.cjs')

// eslint-disable-next-line no-console
console.info('Running collaborate editing tests for the Portable Text Editor')

module.exports = createJestConfig({
  displayName: require('../package.json').name,
  globalSetup: './setup/globalSetup.ts',
  globalTeardown: './setup/globalTeardown.ts',
  setupFilesAfterEnv: ['./setup/afterEnv.ts'],
})
