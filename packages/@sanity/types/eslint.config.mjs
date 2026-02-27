import baseConfig from '@repo/eslint-config'
import {defineConfig} from 'eslint/config'

export default defineConfig([
  ...baseConfig,
  {
    rules: {
      // These rules should be enabled in the future, they are disabled for now to reduce the PR scope for landing oxlint
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
])
