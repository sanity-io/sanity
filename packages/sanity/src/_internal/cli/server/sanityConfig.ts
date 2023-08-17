import path from 'path'
import fs from 'fs/promises'
import {debug as serverDebug} from './debug'

const debug = serverDebug.extend('config')

/**
 * Resolves the path to the studio configuration file with the following extensions,
 * in preferred order: '.mjs', '.js', '.ts', '.jsx', '.tsx' (aligns with vite)
 *
 * Falls back to the default studio configuration exported by `sanity` if none is found
 *
 * @internal
 */
export async function getSanityStudioConfigPath(studioRootPath: string): Promise<string | null> {
  const configPaths = [
    path.join(studioRootPath, 'sanity.config.mjs'),
    path.join(studioRootPath, 'sanity.config.js'),
    path.join(studioRootPath, 'sanity.config.ts'),
    path.join(studioRootPath, 'sanity.config.jsx'),
    path.join(studioRootPath, 'sanity.config.tsx'),
  ]

  debug('Looking for configuration file in %d possible locations', configPaths.length)
  const configs = await Promise.all(
    configPaths.map(async (configPath) => ({
      path: configPath,
      exists: await fileExists(configPath),
    })),
  )

  const availableConfigs = configs.filter((config) => config.exists)
  debug('Found %d available configuration files', availableConfigs.length)

  // No config file exists?
  if (availableConfigs.length === 0) {
    console.warn('No `sanity.config.js`/`sanity.config.ts` found - using default studio config')
    return null
  }

  if (availableConfigs.length > 1) {
    console.warn('Found multiple potential studio configs:')
    availableConfigs.forEach((config) => console.warn(` - ${config.path}`))
    console.warn(`Using ${availableConfigs[0].path}`)
  }

  return availableConfigs[0].path
}

/**
 * Asynchronously checks if a file exists. This is prone to race conditions,
 * as the file can exist/not exist by the time this resolves, but in this
 * case this is an acceptable trade-off. Best effort, and all that.
 */
function fileExists(filePath: string): Promise<boolean> {
  return fs.stat(filePath).then(
    () => true,
    () => false,
  )
}
