const createConfig = require('../../../createJestConfig')

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = createConfig({
  displayName: require('./package.json').name,
  moduleNameMapper: {
    '^part:@sanity/base/schema$': '<rootDir>/test/mocks/schema.js',
    '^part:@sanity/data-aspects/resolver$': '<rootDir>/test/mocks/dataAspects.js',
    '^part:@sanity/base/util/document-action-utils': '<rootDir>/test/mocks/documentActionUtils.js',
  },
})
