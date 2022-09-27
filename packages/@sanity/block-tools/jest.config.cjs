/* eslint-disable tsdoc/syntax */

const {createJestConfig} = require('../../../test/config')

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = createJestConfig({
  displayName: require('./package.json').name,
  testEnvironment: 'node',
  rootDir: __dirname,
  setupFilesAfterEnv: ['./test/setup.ts'],
})
