const path = require('node:path')
const {createJestConfig} = require('../../test/config.cjs')

const cliPath = path.resolve(__dirname, './src/_internal/cli')

module.exports = createJestConfig({
  displayName: require('./package.json').name,
  globalSetup: '<rootDir>/test/setup/global.ts',
  setupFiles: ['<rootDir>/test/setup/environment.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/setup/afterEnv.ts'],
  modulePathIgnorePatterns: [
    '<rootDir>/playwright-ct',
    cliPath, // the CLI has its own jest config
  ],
  projects: [
    __dirname, // self
    cliPath, // cli
  ],
})
