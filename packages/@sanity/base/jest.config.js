module.exports = {
  testRegex: 'test\\/.*\\.test\\.js',
  testURL: 'http://localhost/',
  moduleNameMapper: {
    '^part:@sanity/base/schema?': '<rootDir>/test/mocks/schema.js'
  }
}
