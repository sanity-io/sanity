import fs from 'node:fs'

import {type PackageJson} from '@sanity/cli'

/**
 * Read the `package.json` file at the given path
 *
 * @param filePath - Path to package.json to read
 * @returns The parsed package.json
 */
export function readPackageJson(filePath: string): PackageJson {
  try {
    // eslint-disable-next-line no-sync
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (err) {
    throw new Error(`Failed to read "${filePath}": ${err.message}`)
  }
}
