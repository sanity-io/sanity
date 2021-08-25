/* eslint-disable @typescript-eslint/no-var-requires */
module.exports = {
  testRegex: 'test\\/.*\\.test\\.(js|ts)$',
  testURL: 'http://localhost/',
  moduleNameMapper: {
    '^config:sanity': '<rootDir>/test/mocks/config_sanity.js',
    '^part:@sanity/base/client': '<rootDir>/test/mocks/client.js',
    '^part:@sanity/base/configure-client?': '<rootDir>/test/mocks/undefined.js',
    '^part:@sanity/base/initial-value-templates?': '<rootDir>/test/mocks/templates.js',
    '^part:@sanity/base/schema?': '<rootDir>/test/mocks/schema.js',
    '^part:@sanity/base/user': '<rootDir>/test/mocks/user.js',
  },
}
