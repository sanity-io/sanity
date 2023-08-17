import path from 'path'
import {readFile} from 'fs/promises'
import execa from 'execa'
import semver, {SemVer} from 'semver'
import resolveFrom from 'resolve-from'
import oneline from 'oneline'
import type {CliCommandContext, PackageJson} from '@sanity/cli'
import {peerDependencies} from '../../../../package.json'

const defaultStudioManifestProps: PartialPackageManifest = {
  name: 'studio',
  version: '1.0.0',
}

interface CheckResult {
  didInstall: boolean
}

/**
 * Checks that the studio has declared and installed the required dependencies
 * needed by the Sanity modules. While we generally use regular, explicit
 * dependencies in modules, there are certain dependencies that are better
 * served being peer dependencies, such as react and styled-components.
 *
 * If these dependencies are not installed/declared, we want to prompt the user
 * whether or not to add them to `package.json` and install them
 */
export async function checkRequiredDependencies(context: CliCommandContext): Promise<CheckResult> {
  const {workDir: studioPath, output} = context
  const [studioPackageManifest, installedStyledComponentsVersion] = await Promise.all([
    await readPackageManifest(path.join(studioPath, 'package.json'), defaultStudioManifestProps),
    await readModuleVersion(studioPath, 'styled-components'),
  ])

  const wantedStyledComponentsVersionRange = peerDependencies['styled-components']

  // The studio _must_ now declare `styled-components` as a dependency. If it's not there,
  // we'll want to automatically _add it_ to the manifest and tell the user to reinstall
  // dependencies before running whatever command was being run
  const declaredStyledComponentsVersion = studioPackageManifest.dependencies['styled-components']
  if (!declaredStyledComponentsVersion) {
    const [file, ...args] = process.argv
    const deps = {'styled-components': wantedStyledComponentsVersionRange}
    await installDependencies(deps, context)

    // Re-run the same command (sanity dev/sanity build etc) after installation,
    // as it can have shifted the entire `node_modules` folder around, result in
    // broken assumptions about installation paths. This is a hack, and should be
    // solved properly.
    await execa(file, args, {cwd: studioPath, stdio: 'inherit'})
    return {didInstall: true}
  }

  // Theoretically the version specified in package.json could be incorrect, eg `foo`
  let minDeclaredStyledComponentsVersion: SemVer | null = null
  try {
    minDeclaredStyledComponentsVersion = semver.minVersion(declaredStyledComponentsVersion)
  } catch (err) {
    // Intentional fall-through (variable will be left as null, throwing below)
  }

  if (!minDeclaredStyledComponentsVersion) {
    throw new Error(oneline`
      Declared dependency \`styled-components\` has an invalid version range:
      \`${declaredStyledComponentsVersion}\`.
    `)
  }

  // The declared version should be semver-compatible with the version specified as a
  // peer dependency in `sanity`. If not, we should tell the user to change it.
  //
  // Exception: Ranges are hard to compare. `>=5.0.0 && <=5.3.2 || ^6`... Comparing this
  // to anything is going to be challenging, so only compare "simple" ranges/versions
  // (^x.x.x / ~x.x.x / x.x.x)
  if (
    isComparableRange(declaredStyledComponentsVersion) &&
    !semver.satisfies(minDeclaredStyledComponentsVersion, wantedStyledComponentsVersionRange)
  ) {
    output.warn(oneline`
      Declared version of styled-components (${declaredStyledComponentsVersion})
      is not compatible with the version required by sanity (${wantedStyledComponentsVersionRange}).
      This might cause problems!
    `)
  }

  // Ensure the studio has _installed_ a version of `styled-components`
  if (!installedStyledComponentsVersion) {
    throw new Error(oneline`
      Declared dependency \`styled-components\` is not installed - run
      \`npm install\` or \`yarn\` to install it before re-running this command.
    `)
  }

  // The studio should have an _installed_ version of `styled-components`, and it should
  // be semver compatible with the version specified in `sanity` peer dependencies.
  if (!semver.satisfies(installedStyledComponentsVersion, wantedStyledComponentsVersionRange)) {
    output.warn(oneline`
      Installed version of styled-components (${installedStyledComponentsVersion})
      is not compatible with the version required by sanity (${wantedStyledComponentsVersionRange}).
      This might cause problems!
    `)
  }

  return {didInstall: false}
}

/**
 * Reads the version number of the _installed_ module, or returns `null` if not found
 *
 * @param studioPath - Path of the studio
 * @param moduleName - Name of module to get installed version for
 * @returns Version number, of null
 */
async function readModuleVersion(studioPath: string, moduleName: string): Promise<string | null> {
  const manifestPath = resolveFrom.silent(studioPath, path.join(moduleName, 'package.json'))
  return manifestPath ? (await readPackageManifest(manifestPath)).version : null
}

/**
 * Read the `package.json` file at the given path and return an object that guarantees
 * the presence of name, version, dependencies, dev dependencies and peer dependencies
 *
 * @param packageJsonPath - Path to package.json to read
 * @returns Reduced package.json with guarantees for name, version and dependency fields
 */
async function readPackageManifest(
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

/**
 * Install the passed dependencies at the given version/version range,
 * prompting the user whether to use yarn or npm. If a `yarn.lock` file
 * is found in the working directory, we will default the choice to yarn
 *
 * @param dependencies - Object of dependencies `({[package name]: version})`
 * @param context - CLI context
 */
async function installDependencies(
  dependencies: Record<string, string>,
  context: CliCommandContext,
): Promise<void> {
  const {output, prompt, workDir, cliPackageManager} = context
  const packages: string[] = []

  output.print('The Sanity studio needs to install missing dependencies:')
  for (const [pkgName, version] of Object.entries(dependencies)) {
    const declaration = `${pkgName}@${version}`
    output.print(`- ${declaration}`)
    packages.push(declaration)
  }

  if (!cliPackageManager) {
    output.error(
      'ERROR: Could not determine package manager choice - run `npm install` or equivalent',
    )
    return
  }

  const {getPackageManagerChoice, installNewPackages} = cliPackageManager
  const {mostOptimal, chosen: pkgManager} = await getPackageManagerChoice(workDir, {prompt})
  if (mostOptimal && pkgManager !== mostOptimal) {
    output.warn(
      `WARN: This project appears to be installed with or using ${mostOptimal} - using a different package manager _may_ result in errors.`,
    )
  }

  await installNewPackages({packages, packageManager: pkgManager}, context)
}

function isPackageManifest(item: unknown): item is PartialPackageManifest {
  return typeof item === 'object' && item !== null && 'name' in item && 'version' in item
}

function isComparableRange(range: string): boolean {
  return /^[\^~]?\d+(\.\d+)?(\.\d+)?$/.test(range)
}

function readPackageJson(filePath: string): Promise<PackageJson> {
  return readFile(filePath, 'utf8').then((res) => JSON.parse(res))
}

interface PackageManifest extends DependencyDeclarations {
  name: string
  version: string
}

interface PartialPackageManifest extends Partial<DependencyDeclarations> {
  name: string
  version: string
}

interface DependencyDeclarations {
  dependencies: Record<string, string | undefined>
  devDependencies: Record<string, string | undefined>
}
