import {optimizeLodashImports} from '@optimize-lodash/rollup-plugin'
import {type PkgConfigOptions} from '@sanity/pkg-utils'

const config = {
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
      {
        name: 'todo',
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
  tsconfig: 'tsconfig.lib.json',
} satisfies PkgConfigOptions

export default config
