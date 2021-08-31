const baseConfig = require('../../../jest.config.base')

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...baseConfig,
  displayName: require('./package.json').name,
  testURL: 'http://localhost',
  testPathIgnorePatterns: ['/lib/', '/dist/'],
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    '^part:@sanity/base/schema$': '<rootDir>/test/mocks/schema.js',
    '^part:@sanity/base/initial-value-templates?': '<rootDir>/test/mocks/templates.js',
  },
}
