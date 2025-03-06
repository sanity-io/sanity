/* eslint-disable no-sync */
import fs from 'node:fs'
import path from 'node:path'

import {debug} from '../debug'

/**
 * Resolve project root directory, falling back to cwd if it cannot be found
 */
export function resolveRootDir(cwd: string): string {
  try {
    return resolveProjectRoot(cwd) || cwd
  } catch (err) {
    throw new Error(`Error occurred trying to resolve project root:\n${err.message}`)
  }
}

function hasSanityConfig(basePath: string, configName: string): boolean {
  const buildConfigs = [
    fileExists(path.join(basePath, `${configName}.js`)),
    fileExists(path.join(basePath, `${configName}.ts`)),
    isSanityV2StudioRoot(basePath),
  ]

  return buildConfigs.some(Boolean)
}

function resolveProjectRoot(basePath: string, iterations = 0): string | false {
  const configName = 'sanity.config'
  if (hasSanityConfig(basePath, configName)) {
    return basePath
  }

  const parentDir = path.resolve(basePath, '..')
  if (parentDir === basePath || iterations > 30) {
    // Reached root (or max depth), give up
    return false
  }

  return resolveProjectRoot(parentDir, iterations + 1)
}

function isSanityV2StudioRoot(basePath: string): boolean {
  try {
    const content = fs.readFileSync(path.join(basePath, 'sanity.json'), 'utf8')
    const sanityJson = JSON.parse(content)
    const isRoot = Boolean(sanityJson?.root)
    if (isRoot) {
      debug('Found Sanity v2 studio root at %s', basePath)
    }
    return isRoot
  } catch (err) {
    return false
  }
}

function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath)
}
