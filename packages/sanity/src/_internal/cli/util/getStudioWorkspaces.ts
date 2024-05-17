/* eslint-disable no-sync */
import fs from 'node:fs'
import path from 'node:path'

import {firstValueFrom} from 'rxjs'
import {type Config, resolveConfig, type Workspace, type WorkspaceOptions} from 'sanity'

import {mockBrowserEnvironment} from './mockBrowserEnvironment'

const candidates = [
  'sanity.config.js',
  'sanity.config.jsx',
  'sanity.config.ts',
  'sanity.config.tsx',
]

interface GetStudioWorkspacesOptions {
  configPath?: string
  basePath: string
}

/**
 * Note: Don't run this on the main thread, use it a forked process
 */
export function getStudioConfig({
  basePath,
  configPath: cfgPath,
}: GetStudioWorkspacesOptions): WorkspaceOptions[] {
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
      const message = `Failed to load configuration file "${configPath}":\n${err.message}`
      // this helps preserve the stack trace
      throw Object.assign(err, {message})
    }

    if (!config) throw new Error('Configuration did not export expected config shape')
    const normalized = Array.isArray(config)
      ? config
      : [{...config, name: config.name || 'default', basePath: config.basePath || '/'}]

    return normalized
  } finally {
    cleanup?.()
  }
}

/**
 * Note: Don't run this on the main thread, use it a forked process
 */
export async function getStudioWorkspaces(
  options: GetStudioWorkspacesOptions,
): Promise<Workspace[]> {
  let cleanup

  try {
    cleanup = mockBrowserEnvironment(options.basePath)
    const config = getStudioConfig(options)
    const workspaces = await firstValueFrom(resolveConfig(config))
    if (!workspaces) throw new Error('Failed to resolve configuration')
    return workspaces
  } finally {
    cleanup?.()
  }
}
