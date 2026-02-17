import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  define: {
    __DEV__: false,
  },
  dist: 'lib',
  extract: {
    // TODO: disabled for now as it's not compatible with `dts: 'rolldown'`, we should replace `@microsoft/api-extractor` with a better tool for validating tsdoc tags`
    enabled: false,
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
  // `dts: 'api-extractor'` is not compatible with `customConditions: ['monorepo']` for typegen, it leads to invalid syntax in `.d.ts` files
  dts: 'rolldown',
})
