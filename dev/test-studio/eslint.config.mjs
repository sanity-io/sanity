import {defineConfig} from 'eslint/config'
import baseConfig from '@repo/eslint-config'

export default defineConfig([
  {ignores: ['sanity.theme.mjs', 'workshop/scopes.js']},
  ...baseConfig,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
])
