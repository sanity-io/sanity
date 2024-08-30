import {defineConfig} from '@sanity/pkg-utils'
// @ts-expect-error -- missing types
import {importMetaAssets} from '@web/rollup-plugin-import-meta-assets'

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
    optimizeLodash: true,
    plugins: ([t1, t2, t3, t4, t5, t6, ...plugins]) => [
      t1,
      t2,
      t3,
      t4,
      t5,
      t6,
      importMetaAssets({
        include: ['**/checkoutPair.mjs', '**/checkoutPair.ts'],
      }),
      ...plugins,
    ],
  },
  tsconfig: 'tsconfig.lib.json',
  strictOptions: {
    noImplicitBrowsersList: 'off',
    noImplicitSideEffects: 'error',
  },
})
