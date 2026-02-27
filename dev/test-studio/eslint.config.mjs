import baseConfig from '@repo/eslint-config'
import {defineConfig} from 'eslint/config'

export default defineConfig([
  {ignores: ['sanity.theme.mjs']},
  ...baseConfig,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'react/jsx-no-bind': 'off',
      'no-warning-comments': 'off',
    },
  },
])
