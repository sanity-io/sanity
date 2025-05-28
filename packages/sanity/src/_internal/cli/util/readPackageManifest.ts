import {readFile} from 'node:fs/promises'

import {type PackageJson} from '@sanity/cli'

interface DependencyDeclarations {
  dependencies: Record<string, string | undefined>
  devDependencies: Record<string, string | undefined>
}

interface PackageManifest extends DependencyDeclarations {
  name: string
  version: string
}

export interface PartialPackageManifest extends Partial<DependencyDeclarations> {
  name: string
  version: string
}

function isPackageManifest(item: unknown): item is PartialPackageManifest {
  return typeof item === 'object' && item !== null && 'name' in item && 'version' in item
}

/**
 * Read the `package.json` file at the given path
 *
 * @param filePath - Path to package.json to read
 * @returns The parsed package.json
 */
export async function readPackageJson(filePath: string): Promise<PackageJson> {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'))
  } catch (err) {
    throw new Error(`Failed to read "${filePath}": ${err.message}`)
  }
}
/**
 * Read the `package.json` file at the given path and return an object that guarantees
 * the presence of name, version, dependencies, dev dependencies and peer dependencies
 *
 * @param packageJsonPath - Path to package.json to read
 * @returns Reduced package.json with guarantees for name, version and dependency fields
 */
export async function readPackageManifest(
  packageJsonPath: string,
  defaults: Partial<PartialPackageManifest> = {},
): Promise<PackageManifest> {
  let manifest: unknown
  try {
    manifest = {...defaults, ...(await readPackageJson(packageJsonPath))}
  } catch (err) {
    throw new Error(`Failed to read "${packageJsonPath}": ${err.message}`)
  }

  if (!isPackageManifest(manifest)) {
    throw new Error(`Failed to read "${packageJsonPath}": Invalid package manifest`)
  }

  const {name, version, dependencies = {}, devDependencies = {}} = manifest
  return {name, version, dependencies, devDependencies}
}
