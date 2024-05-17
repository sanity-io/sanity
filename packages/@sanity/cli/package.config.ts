/* eslint-disable no-sync */
import fs from 'node:fs'
import path from 'node:path'

import baseConfig from '@repo/package.config'
import {nodeResolve} from '@rollup/plugin-node-resolve'
import {defineConfig} from '@sanity/pkg-utils'
import isBuiltin from 'is-builtin-module'

const workersDir = path.join(__dirname, 'src', 'workers')

const workerNames = fs
  .readdirSync(workersDir)
  .filter((file) => file.endsWith('.ts'))
  .map((file) => path.basename(file, '.ts'))

export default defineConfig({
  ...baseConfig,

  // This is a workaround for an issue where the `readable-stream` package imports
  // from `string_decoder/` instead of `string_decoder` (note the trailing slash),
  // which _should_ tell rollup not to use the built-in `string_decoder` module,
  // which it unfortunately does not. Hoping we can get rid of this hack soon:
  // https://github.com/rollup/plugins/issues/1211
  // https://github.com/sindresorhus/is-builtin-module/issues/7
  // https://github.com/sindresorhus/builtin-modules/pull/17
  rollup: {
    plugins: (plugins) => [
      ...plugins.filter((plugin) => plugin.name !== 'node-resolve'),
      nodeResolve({
        browser: false,
        extensions: ['.cjs', '.mjs', '.js', '.jsx', '.json', '.node'],
        preferBuiltins: false,
        resolveOnly: (moduleName) => moduleName === 'string_decoder' || !isBuiltin(moduleName),
      }),
    ],
  },

  bundles: [
    {
      source: './src/cli.ts',
      require: './lib/cli.js',
      runtime: 'node',
    },
    {
      source: './src/run.ts',
      require: './lib/run.js',
      runtime: 'node',
    },

    ...workerNames.map((name) => ({
      source: `./src/workers/${name}.ts`,
      require: `./lib/workers/${name}.js`,
      runtime: 'node' as const,
    })),
  ],

  runtime: 'node',
})
