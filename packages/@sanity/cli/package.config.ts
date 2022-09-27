import {defineConfig} from '@sanity/pkg-utils'
import baseConfig from '../../../package.config'

export default defineConfig({
  ...baseConfig,
  exports: (exports) => ({
    ...exports,
    './cli': {
      source: './src/cli.ts',
      require: './lib/cli.js',
      default: './lib/cli.js',
    },
  }),
  runtime: 'node',
})
