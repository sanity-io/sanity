import {existsSync} from 'node:fs'
import {join as joinPath, resolve as resolvePath} from 'node:path'

/**
 * Find the closest `package.json` file to the given directory
 *
 * @param startDir - The directory to start searching from
 * @returns The path to the closest `package.json` file, or `undefined` if none was found
 * @internal
 */
export function findClosestPackageJson(startDir: string): string | undefined {
  const packageJsonPath = joinPath(startDir, 'package.json')
  if (existsSync(packageJsonPath)) {
    return packageJsonPath
  }

  const parentDir = resolvePath(startDir, '..')
  if (parentDir === startDir) {
    return undefined
  }

  return findClosestPackageJson(parentDir)
}
