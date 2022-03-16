const {createJestConfig} = require('../../../test/config')

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = createJestConfig({
  displayName: require('./package.json').name,
  // moduleNameMapper: {
  //   '^part:@sanity/base/schema$': '<rootDir>/test/mocks/schema.js',
  //   '^part:@sanity/base/initial-value-templates\\?': '<rootDir>/test/mocks/templates.js',
  // },
})
