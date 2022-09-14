import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  dist: 'lib',
  extract: {
    rules: {
      // Disable this rule until `@microsoft/api-extractor` properly supports multiple exports
      'ae-forgotten-export': 'off',

      'ae-incompatible-release-tags': 'warn',
      'ae-internal-missing-underscore': 'warn',
      'ae-missing-release-tag': 'warn',
    },
  },
  minify: false,
})
