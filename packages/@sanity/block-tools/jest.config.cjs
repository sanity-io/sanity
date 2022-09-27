'use strict'

const {createJestConfig} = require('../../../test/config.cjs')

module.exports = createJestConfig({
  displayName: require('./package.json').name,
  testEnvironment: 'node',
  rootDir: __dirname,
  setupFilesAfterEnv: ['./test/setup.ts'],
})
