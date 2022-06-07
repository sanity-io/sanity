/* eslint-disable no-sync */
import fs from 'fs'
import path from 'path'
import {resolveConfig, Config, ResolvedConfig} from 'sanity/_unstable'
import {mockBrowserEnvironment} from './mockBrowserEnvironment'

const candidates = [
  'sanity.config.js',
  'sanity.config.jsx',
  'sanity.config.ts',
  'sanity.config.tsx',
]

/**
 * Note: Don't run this on the main thread, use it a forked process
 */
export function getStudioConfig(options: {configPath?: string; basePath: string}): ResolvedConfig {
  const {basePath, configPath: cfgPath} = options

  let resolved: ResolvedConfig | undefined

  let cleanup
  try {
    cleanup = mockBrowserEnvironment(basePath)

    let configPath = cfgPath
    if (configPath && !fs.existsSync(configPath)) {
      throw new Error(`Failed to find config at "${cfgPath}"`)
    } else if (!configPath) {
      configPath = candidates
        .map((candidate) => path.join(basePath, candidate))
        .find((candidate) => fs.existsSync(candidate))
    }

    if (!configPath) {
      throw new Error(`Failed to resolve sanity.config.(js|ts) for base path "${basePath}"`)
    }

    let config: Config | undefined
    try {
      // eslint-disable-next-line import/no-dynamic-require
      const mod = require(configPath)
      config = mod.__esModule && mod.default ? mod.default : mod
    } catch (err) {
      throw new Error(`Failed to load configuration file "${configPath}":\n${err.message}`)
    }

    if (!config || !('type' in config) || config.type !== 'sanity-config') {
      throw new Error('Configuration did not export expected config shape')
    }

    resolved = resolveConfig(config)
  } catch (error) {
    if (cleanup) {
      cleanup()
    }

    throw error
  }

  cleanup()

  if (!resolved) {
    throw new Error('Failed to resolve configuration')
  }

  return resolved
}
