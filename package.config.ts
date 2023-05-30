import {optimizeLodashImports} from '@optimize-lodash/rollup-plugin'
import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  define: {
    __DEV__: false,
  },
  dist: 'lib',
  extract: {
    customTags: [
      {
        name: 'hidden',
        allowMultiple: true,
        syntaxKind: 'block',
      },
    ],
    rules: {
      // Disable rules for now
      'ae-forgotten-export': 'off',
      'ae-incompatible-release-tags': 'off',
      'ae-internal-missing-underscore': 'off',
      'ae-missing-release-tag': 'off',
    },
  },
  legacyExports: true,
  rollup: {
    plugins: [optimizeLodashImports()],
  },
  tsconfig: 'tsconfig.dist.json',
})
