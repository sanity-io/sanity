/**
 * Reads the Sanity CLI config from one of the following files (in preferred order):
 *   - sanity.cli.js
 *   - sanity.cli.ts
 *
 * Note: There are two ways of using this:
 * a) `getCliConfig(cwd)`
 * b) `getCliConfig(cwd, {forked: true})`
 *
 * Approach a is generally a bit faster as it avoids the forking startup time, while
 * approach b could be considered "safer" since any side-effects of running the config
 * file will not bleed into the current CLI process directly.
 */
import fs from 'node:fs'
import path from 'node:path'
import {Worker} from 'node:worker_threads'

import {debug} from '../debug'
import {type CliConfig} from '../types'
import {getCliWorkerPath} from './cliWorker'
import {dynamicRequire} from './dynamicRequire'

export type CliConfigResult = {config: CliConfig; path: string} | {config: null; path: string}

export async function getCliConfig(
  cwd: string,
  {forked}: {forked?: boolean} = {},
): Promise<CliConfigResult | null> {
  let clearCache = false
  if (forked) {
    try {
      return await getCliConfigForked(cwd)
    } catch (err) {
      debug('Error in getCliConfigForked', err)
      clearCache = true
      // Intentional noop - try unforked variant
    }
  }

  const {unregister} = __DEV__
    ? {unregister: () => undefined}
    : // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('esbuild-register/dist/node').register({
        target: `node${process.version.slice(1)}`,
        supported: {'dynamic-import': true},
        // Force CJS output since we use require() to load the config
        format: 'cjs',
      })

  try {
    // If forked execution failed, we need to clear the cache to reload the env vars
    return getSanityCliConfig(cwd, clearCache)
  } finally {
    unregister()
  }
}

async function getCliConfigForked(cwd: string): Promise<CliConfigResult | null> {
  const workerPath = await getCliWorkerPath('getCliConfig')
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerPath, {
      workerData: cwd,
      env: process.env,
    })
    worker.on('message', (message) => {
      if (message.type === 'config') {
        resolve(message.config)
      } else {
        const error = new Error(message.error)
        ;(error as any).type = message.errorType
        reject(new Error(message.error))
      }
    })
    worker.on('error', reject)
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`))
      }
    })
  })
}

export function getSanityCliConfig(cwd: string, clearCache = false): CliConfigResult | null {
  let configName = 'sanity.cli'

  if (process.env.SANITY_CLI_TEST_CONFIG_NAME && process.env.TEST === 'true') {
    configName = process.env.SANITY_CLI_TEST_CONFIG_NAME
  }

  const jsConfigPath = path.join(cwd, `${configName}.js`)
  const tsConfigPath = path.join(cwd, `${configName}.ts`)

  const [js, ts] = [fs.existsSync(jsConfigPath), fs.existsSync(tsConfigPath)]

  if (!js && !ts) {
    return null
  }

  if (!js && ts) {
    return {
      config: importConfig(tsConfigPath, clearCache),
      path: tsConfigPath,
    }
  }

  if (js && ts) {
    warn(`Found both \`${configName}.js\` and \`${configName}.ts\` - using ${configName}.js`)
  }

  return {
    config: importConfig(jsConfigPath, clearCache),
    path: jsConfigPath,
  }
}

function importConfig(filePath: string, clearCache: boolean): CliConfig | null {
  try {
    // Clear module cache if requested (needed for env var reload)
    if (clearCache) {
      const resolvedPath = dynamicRequire.resolve(filePath)
      delete dynamicRequire.cache[resolvedPath]
    }

    const config = dynamicRequire<CliConfig | {default: CliConfig} | null>(filePath)
    if (config === null || typeof config !== 'object') {
      throw new Error('Module export is not a configuration object')
    }

    return 'default' in config ? config.default : config
  } catch (err) {
    // If attempting to import `defineCliConfig` or similar from `sanity/cli`,
    // accept the fact that it might not be installed. Instead, let the CLI
    // give a warning about the `sanity` module not being installed
    if (err.code === 'MODULE_NOT_FOUND' && err.message.includes('sanity/cli')) {
      return null
    }

    console.error(`Error reading "${filePath}": ${err.message}`)
    return null
  }
}

function warn(warning: string) {
  if (typeof process.send === 'function') {
    process.send({type: 'warning', warning})
  } else {
    console.warn(warning)
  }
}
