import {execSync} from 'node:child_process'
import path, {dirname} from 'node:path'
import {fileURLToPath} from 'node:url'

const rootPath = path.join(dirname(fileURLToPath(import.meta.url)), '..', '..')

interface PnpmPackage {
  name: string
  path: string
}

/**
 * @internal
 */
export function getManifestPaths(): string[] {
  const output = execSync('pnpm ls -r --json --depth -1', {
    cwd: rootPath,
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
  })

  const packages: PnpmPackage[] = JSON.parse(output)

  return packages
    .map((pkg) => path.relative(rootPath, path.join(pkg.path, 'package.json')))
    .filter((p) => p !== 'package.json') // exclude root
}
