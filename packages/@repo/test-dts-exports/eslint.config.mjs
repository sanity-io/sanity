import baseConfig from '@repo/eslint-config'
import {defineConfig} from 'eslint/config'

export default defineConfig([
  ...baseConfig,
  {
    rules: {
      'import/consistent-type-specifier-style': 'off',
      'simple-import-sort/imports': 'off',
      'max-statements': 'off',
      'unused-imports/no-unused-imports': 'off',
      'import/no-named-default': 'off',
      'no-warning-comments': 'error',
    },
  },
])
