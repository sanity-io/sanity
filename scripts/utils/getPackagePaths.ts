/* eslint-disable no-sync */
import fs from 'node:fs'
import path from 'node:path'
import glob from 'glob'

interface LernaConfig {
  packages: string[]
}

const config: LernaConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'lerna.json'), 'utf8'),
)

if (!('packages' in config) || !Array.isArray(config.packages)) {
  throw new Error('Lerna config is missing "packages" array')
}

const patterns = config.packages.map((pkg) => path.join(pkg, 'package.json'))

/**
 * @internal
 */
export function getManifestPaths(): string[] {
  return patterns.flatMap((pattern) => glob.sync(pattern))
}

/**
 * @internal
 */
export function getPackagePaths(): string[] {
  return getManifestPaths().map((p) => path.dirname(p))
}
