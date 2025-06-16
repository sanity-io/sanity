import baseConfig from '@repo/eslint-config'
import {defineConfig} from 'eslint/config'

export default defineConfig([
  ...baseConfig,
  {
    rules: {
      'import/no-extraneous-dependencies': 'off',
      'no-warning-comments': 'off',
    },
  },
])
