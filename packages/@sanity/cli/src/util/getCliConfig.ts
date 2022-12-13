/* eslint-disable no-sync */

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
import path from 'path'
import fs from 'fs'
import {Worker} from 'worker_threads'
import type {CliConfig, SanityJson} from '../types'
import {dynamicRequire} from './dynamicRequire'
import {getCliWorkerPath} from './cliWorker'

export type CliMajorVersion = 2 | 3

export type CliConfigResult =
  | {config: SanityJson; path: string; version: 2}
  | {config: CliConfig; path: string; version: 3}
  | {config: null; path: string; version: CliMajorVersion}

export async function getCliConfig(
  cwd: string,
  {forked}: {forked?: boolean} = {}
): Promise<CliConfigResult | null> {
  if (forked) {
    try {
      return await getCliConfigForked(cwd)
    } catch (err) {
      // Intentional noop - try unforked variant
    }
  }

  const {unregister} = __DEV__
    ? {unregister: () => undefined}
    : require('esbuild-register/dist/node').register()

  try {
    const v3Config = getSanityCliConfig(cwd)
    if (v3Config) {
      return v3Config
    }

    return getSanityJsonConfig(cwd)
  } catch (err) {
    throw err
  } finally {
    unregister()
  }
}

export function getCliConfigSync(cwd: string): CliConfigResult | null {
  const v3Config = getSanityCliConfig(cwd)
  return v3Config ? v3Config : getSanityJsonConfig(cwd)
}

async function getCliConfigForked(cwd: string): Promise<CliConfigResult | null> {
  const workerPath = await getCliWorkerPath('getCliConfig')
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerPath, {workerData: cwd})
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

function getSanityJsonConfig(cwd: string): CliConfigResult | null {
  const configPath = path.join(cwd, 'sanity.json')

  if (!fs.existsSync(configPath)) {
    return null
  }

  return {
    config: loadJsonConfig(configPath),
    path: configPath,
    version: 2,
  }
}

function getSanityCliConfig(cwd: string): CliConfigResult | null {
  const jsConfigPath = path.join(cwd, 'sanity.cli.js')
  const tsConfigPath = path.join(cwd, 'sanity.cli.ts')

  const [js, ts] = [fs.existsSync(jsConfigPath), fs.existsSync(tsConfigPath)]

  if (!js && !ts) {
    return null
  }

  if (!js && ts) {
    return {
      config: importConfig(tsConfigPath),
      path: tsConfigPath,
      version: 3,
    }
  }

  if (js && ts) {
    warn('Found both `sanity.cli.js` and `sanity.cli.ts` - using sanity.cli.js')
  }

  return {
    config: importConfig(jsConfigPath),
    path: jsConfigPath,
    version: 3,
  }
}

function loadJsonConfig(filePath: string): SanityJson | null {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(content)
  } catch (err) {
    console.error(`Error reading "${filePath}": ${err.message}`)
    return null
  }
}

function importConfig(filePath: string): CliConfig | null {
  try {
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
