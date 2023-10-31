import {defineConfig} from '@sanity/pkg-utils'
import baseConfig from '../../../package.config'

export default defineConfig({
  ...baseConfig,
  bundles: [
    {
      source: './src/cli/index.ts',
      require: './lib/cli.js',
    },
  ],
  runtime: 'node',
})
