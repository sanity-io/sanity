import {type PackageJson} from '../../types'
import fs from 'node:fs'

/**
 * Read the `package.json` file at the given path
 *
 * @param filePath - Path to package.json to read
 * @returns The parsed package.json
 */
export function readPackageJson(filePath: string): PackageJson | undefined {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch {
    return undefined
  }
}
