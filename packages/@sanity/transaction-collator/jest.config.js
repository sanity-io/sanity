const createConfig = require('../../../jest.config.base')

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = createConfig({
  displayName: require('./package.json').name,
  moduleNameMapper: {
    '^part:@sanity/base/schema$': '<rootDir>/test/mocks/schema.js',
  },
})
