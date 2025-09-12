import fs from 'node:fs'
import path from 'node:path'

import {globSync} from 'glob'

import {MONOREPO_ROOT} from './constants'

interface LernaConfig {
  packages?: string[]
}

const LERNA_CONFIG_PATH = path.join(MONOREPO_ROOT, 'lerna.json')

function getLernaConfig(): LernaConfig {
  return JSON.parse(fs.readFileSync(LERNA_CONFIG_PATH, 'utf8'))
}

/**
 * @internal
 */
export function getPackageJsonPaths(): string[] {
  const lernaConfig = getLernaConfig()
  if (!('packages' in lernaConfig) || !Array.isArray(lernaConfig.packages)) {
    throw new Error('Lerna config is missing "packages" array')
  }

  return lernaConfig.packages
    .map((pkg) => path.join(pkg, 'package.json'))
    .flatMap((pattern) => globSync(pattern, {cwd: MONOREPO_ROOT}))
}

/**
 * @internal
 */
export function getPackageDirectories(): string[] {
  return getPackageJsonPaths().map((p) => path.dirname(p))
}
