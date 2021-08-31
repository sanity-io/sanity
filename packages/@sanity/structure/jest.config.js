const baseConfig = require('../../../jest.config.base')

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...baseConfig,
  displayName: require('./package.json').name,
  testEnvironment: 'node',
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    '^part:@sanity/base/schema$': '<rootDir>/test/mocks/schema.js',
    '^part:@sanity/base/client$': '<rootDir>/test/mocks/client.js',
    '^part:@sanity/desk-tool/structure\\??$': '<rootDir>/test/mocks/userStructure.js',
    '^part:@sanity/data-aspects/resolver$': '<rootDir>/test/mocks/dataAspects.js',
    '^part:@sanity/base/.*?-icon$': '<rootDir>/test/mocks/icon.js',
    '^part:@sanity/base/util/document-action-utils': '<rootDir>/test/mocks/documentActionUtils.js',
  },
}
