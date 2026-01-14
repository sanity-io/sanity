import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  define: {
    __DEV__: false,
  },
  dist: 'lib',
  extract: {
    // We already check types with `check:types` scripts
    checkTypes: false,

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
  tsconfig: 'tsconfig.lib.json',
  strictOptions: {
    noImplicitBrowsersList: 'off',
    noImplicitSideEffects: 'error',
    noPublishConfigExports: 'error',
  },
})
