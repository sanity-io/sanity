const createConfig = require('../../../createJestConfig')

module.exports = createConfig({
  displayName: require('./package.json').name,
  testEnvironment: 'node',
  moduleNameMapper: {
    '^part:@sanity/base/schema$': '<rootDir>/test/mocks/schema.js',
    '^part:@sanity/base/client$': '<rootDir>/test/mocks/client.js',
    '^part:@sanity/desk-tool/structure\\??$': '<rootDir>/test/mocks/userStructure.js',
    '^part:@sanity/data-aspects/resolver$': '<rootDir>/test/mocks/dataAspects.js',
    '^part:@sanity/base/util/document-action-utils': '<rootDir>/test/mocks/documentActionUtils.js',
  },
})
