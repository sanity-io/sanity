import fs from 'node:fs'
import path, {dirname} from 'node:path'
import {fileURLToPath} from 'node:url'

import {globSync} from 'glob'

interface LernaConfig {
  packages: string[]
}

const config: LernaConfig = JSON.parse(
  fs.readFileSync(
    path.join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'lerna.json'),
    'utf8',
  ),
)

if (!('packages' in config) || !Array.isArray(config.packages)) {
  throw new Error('Lerna config is missing "packages" array')
}

const patterns = config.packages.map((pkg) => path.join(pkg, 'package.json'))

/**
 * @internal
 */
export function getManifestPaths(): string[] {
  return patterns.flatMap((pattern) => globSync(pattern))
}

/**
 * @internal
 */
export function getPackagePaths(): string[] {
  return getManifestPaths().map((p) => path.dirname(p))
}
