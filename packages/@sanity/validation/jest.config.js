const path = require('path')

/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  verbose: true,
  moduleNameMapper: {
    '@sanity/validation': path.resolve(__dirname, './src'),
    'part:@sanity/base/schema-creator': path.resolve(__dirname, '../base/lib/schema/createSchema'),
    'part:@sanity/form-builder/input/legacy-date/schema?': path.resolve(
      __dirname,
      './test/nullExport'
    ),
    'part:@sanity/base/client': path.resolve(__dirname, './test/mockClient'),
  },
}

module.exports = config
