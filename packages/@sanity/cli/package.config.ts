/* eslint-disable no-sync */
import fs from 'fs'
import path from 'path'
import {defineConfig, PkgExports} from '@sanity/pkg-utils'
import baseConfig from '../../../package.config'

export default defineConfig({
  ...baseConfig,
  exports: (existingExports) => ({
    ...existingExports,
    './cli': {
      source: './src/cli.ts',
      require: './lib/cli.js',
      default: './lib/cli.js',
    },
    ...getWorkerExports(),
  }),
  runtime: 'node',
})

function getWorkerExports(): PkgExports {
  const workersDir = path.join(__dirname, 'src', 'workers')
  const sourceFiles = fs
    .readdirSync(workersDir)
    .filter((file) => file.endsWith('.ts'))
    .map((file) => path.basename(file, '.ts'))

  const workers: PkgExports = {}
  for (const name of sourceFiles) {
    workers[`./workers/${name}`] = {
      source: `./src/workers/${name}.ts`,
      require: `./lib/workers/${name}.js`,
      default: `./lib/workers/${name}.js`,
    }
  }

  return workers
}
