module.exports = {
  testRegex: 'test\\/.*\\.test\\.(js|ts)$',
  testURL: 'http://localhost/',
  setupFiles: ['./setup-jest.js'],
  moduleNameMapper: {
    '^part:@sanity/base/schema?': '<rootDir>/test/mocks/schema',
    '^part:@sanity/base/client': '<rootDir>/test/mocks/client',
    '^part:@sanity/base/initial-value-templates?': '<rootDir>/test/mocks/templates',
    '^part:@sanity/base/util/search-utils$': '<rootDir>/src/util/searchUtils',
  },
}
