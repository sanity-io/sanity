import baseConfig from '@repo/package.config'
import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  ...baseConfig,

  extract: {
    ...baseConfig.extract,
    rules: {
      ...baseConfig.extract.rules,
      'ae-forgotten-export': 'off',
      'ae-incompatible-release-tags': 'warn',
      'ae-missing-release-tag': 'warn',
    },
  },
})
