/* eslint-disable no-sync */
import fs from 'fs'
import path from 'path'
import {defineConfig} from '@sanity/pkg-utils'
import baseConfig from '../../../package.config'

const workersDir = path.join(__dirname, 'src', 'workers')

const workerNames = fs
  .readdirSync(workersDir)
  .filter((file) => file.endsWith('.ts'))
  .map((file) => path.basename(file, '.ts'))

export default defineConfig({
  ...baseConfig,

  bundles: [
    {
      source: './src/cli.ts',
      require: './lib/cli.js',
    },
    {
      source: './src/run.ts',
      require: './lib/run.js',
    },

    ...workerNames.map((name) => ({
      source: `./src/workers/${name}.ts`,
      require: `./lib/workers/${name}.js`,
    })),
  ],

  runtime: 'node',
})
