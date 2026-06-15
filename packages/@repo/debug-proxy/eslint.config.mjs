import baseConfig from '@repo/eslint-config'
import {defineConfig} from 'eslint/config'

export default defineConfig([
  ...baseConfig,
  {
    rules: {
      'no-console': 'off',
      // The proxy is a dev-only tool run directly (never as a cached turbo
      // task), so its env vars don't belong in turbo.json
      'turbo/no-undeclared-env-vars': 'off',
    },
  },
])
