import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  dist: 'lib',
  extract: {
    rules: {
      // Disable rules for now
      'ae-forgotten-export': 'off',
      'ae-incompatible-release-tags': 'off',
      'ae-internal-missing-underscore': 'off',
      'ae-missing-release-tag': 'off',
    },
  },
  minify: false,
})
