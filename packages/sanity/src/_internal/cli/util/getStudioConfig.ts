/* eslint-disable no-sync */
import fs from 'fs'
import path from 'path'
import {first} from 'rxjs/operators'
import {firstValueFrom} from 'rxjs'
import {mockBrowserEnvironment} from './mockBrowserEnvironment'
import {resolveConfig, Config, Workspace} from 'sanity'

const candidates = [
  'sanity.config.js',
  'sanity.config.jsx',
  'sanity.config.ts',
  'sanity.config.tsx',
]

/**
 * Note: Don't run this on the main thread, use it a forked process
 */
export async function getStudioConfig(options: {
  configPath?: string
  basePath: string
}): Promise<Workspace[]> {
  let workspaces: Workspace[] | undefined

  const {basePath, configPath: cfgPath} = options

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

    if (!config) {
      throw new Error('Configuration did not export expected config shape')
    }

    workspaces = await firstValueFrom(resolveConfig(config))
  } catch (error) {
    if (cleanup) {
      cleanup()
    }

    throw error
  }

  cleanup()

  if (!workspaces) {
    throw new Error('Failed to resolve configuration')
  }

  return workspaces
}
