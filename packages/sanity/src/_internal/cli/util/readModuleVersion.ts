import path from 'node:path'

import resolveFrom from 'resolve-from'

import {readPackageManifest} from './readPackageManifest'

/**
 * Reads the version number of the _installed_ module, or returns `null` if not found
 *
 * @param dir - Path of the directory to read the module from
 * @param moduleName - Name of module to get installed version for
 * @returns Version number, of null
 */
export async function readModuleVersion(dir: string, moduleName: string): Promise<string | null> {
  const manifestPath = resolveFrom.silent(dir, path.join(moduleName, 'package.json'))
  return manifestPath ? (await readPackageManifest(manifestPath)).version : null
}
