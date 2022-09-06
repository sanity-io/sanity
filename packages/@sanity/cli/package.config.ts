// eslint-disable-next-line import/no-extraneous-dependencies
import {defineConfig} from '@sanity/pkg-utils'
import baseConfig from '../../../package.config'

export default defineConfig({
  ...baseConfig,
  exports: (exports) => ({
    ...exports,
    './cli': {
      source: './src/cli.ts',
      require: './lib/cli.cjs',
      default: './lib/cli.cjs',
    },
  }),
  runtime: 'node',
})
