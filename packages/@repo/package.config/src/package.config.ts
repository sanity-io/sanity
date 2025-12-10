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
  dts: 'rolldown',
  // Don't use `@typescript/native-preview` to generate dts yet, it's not ready
  tsgo: false,
})
