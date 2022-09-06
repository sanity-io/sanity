/* eslint-disable tsdoc/syntax */

const {createJestConfig} = require('../../../test/config')

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = createJestConfig({
  displayName: require('./package.json').name,
  globalSetup: '<rootDir>/test/setup/globalSetup.ts',
  globalTeardown: '<rootDir>/test/setup/globalTeardown.ts',
  setupFilesAfterEnv: ['<rootDir>/test/setup/afterEnv.ts'],
})
