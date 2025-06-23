import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  define: {
    __DEV__: false,
  },
  dist: 'lib',
  extract: {
    enabled: process.env.SANITY_PKG_DTS === 'api-extractor',
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
      'ae-incompatible-release-tags': 'off',
      'ae-internal-missing-underscore': 'off',
      'ae-missing-release-tag': 'off',
    },
  },
  rollup: {
    optimizeLodash: true,
  },
  tsconfig: 'tsconfig.lib.json',
  strictOptions: {
    noImplicitBrowsersList: 'off',
    noImplicitSideEffects: 'error',
  },
  // @TODO Disabled until https://github.com/sxzz/rolldown-plugin-dts/issues/45 is fixed
  // dts: process.env.SANITY_PKG_DTS === 'api-extractor' ? 'api-extractor' : 'rolldown',
})
