const baseConfig = require('../../../jest.config.base')

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...baseConfig,
  displayName: require('./package.json').name,
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    '^config:sanity': '<rootDir>/test/mocks/config_sanity.js',
    '^part:@sanity/base/client': '<rootDir>/test/mocks/client.js',
    '^part:@sanity/base/configure-client?': '<rootDir>/test/mocks/undefined.js',
    '^part:@sanity/base/initial-value-templates?': '<rootDir>/test/mocks/templates.js',
    '^part:@sanity/base/schema?': '<rootDir>/test/mocks/schema.js',
    '^part:@sanity/base/user': '<rootDir>/test/mocks/user.js',
  },
}
