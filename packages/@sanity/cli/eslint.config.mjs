import baseConfig from '@repo/eslint-config'
import {defineConfig} from 'eslint/config'
import globals from 'globals'

export default defineConfig([
  ...baseConfig,
  {ignores: ['templates/**/*']},
  {
    name: 'disable-browser-globals',
    languageOptions: {
      // The default globals added by `@repo/eslint-config` includes browser globals, here we want them explicitly disabled
      globals: Object.fromEntries(Object.keys(globals.browser).map((key) => [key, false])),
    },
  },
  {
    name: '@sanity/cli/overrides',
    rules: {
      'complexity': [1, 18],
      // Should be enabled in the future
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  {
    name: '@sanity/cli/templates',
    files: ['templates/**/*'],
    rules: {
      'import/no-unresolved': 'off',
      'no-restricted-imports': 'off',
    },
  },
  {
    name: '@sanity/cli/test',
    files: ['test/**/*'],
    rules: {
      'max-nested-callbacks': 'off',
    },
  },
  {
    name: '@sanity/cli/test/__fixtures__/v3',
    files: ['test/__fixtures__/v3/**/*'],
  },
])
