import path from 'node:path'

import {type CliCommandContext} from '@sanity/cli'
import execa from 'execa'
import oneline from 'oneline'
import semver, {type SemVer} from 'semver'

import {peerDependencies} from '../../../../package.json'
import {determineIsApp} from './determineIsApp'
import {readModuleVersion} from './readModuleVersion'
import {type PartialPackageManifest, readPackageManifest} from './readPackageManifest'

const defaultStudioManifestProps: PartialPackageManifest = {
  name: 'studio',
  version: '1.0.0',
}

interface CheckResult {
  didInstall: boolean
  installedSanityVersion: string
}

/**
 * Checks that the studio has declared and installed the required dependencies
 * needed by the Sanity modules. While we generally use regular, explicit
 * dependencies in modules, there are certain dependencies that are better
 * served being peer dependencies, such as react and styled-components.
 *
 * If these dependencies are not installed/declared, we want to prompt the user
 * whether or not to add them to `package.json` and install them
 *
 * Additionally, returns the version of the 'sanity' dependency from the package.json.
 */
export async function checkRequiredDependencies(context: CliCommandContext): Promise<CheckResult> {
  // currently there's no check needed for custom apps,
  // but this should be removed once they are more mature
  const isApp = determineIsApp(context.cliConfig)
  if (isApp) {
    return {didInstall: false, installedSanityVersion: ''}
  }

  const {workDir: studioPath, output} = context
  const [studioPackageManifest, installedStyledComponentsVersion, installedSanityVersion] =
    await Promise.all([
      await readPackageManifest(path.join(studioPath, 'package.json'), defaultStudioManifestProps),
      await readModuleVersion(studioPath, 'styled-components'),
      await readModuleVersion(studioPath, 'sanity'),
    ])

  const wantedStyledComponentsVersionRange = peerDependencies['styled-components']

  // Retrieve the version of the 'sanity' dependency
  if (!installedSanityVersion) {
    throw new Error('Failed to read the installed sanity version.')
  }

  // The studio _must_ now declare `styled-components` as a dependency. If it's not there,
  // we'll want to automatically _add it_ to the manifest and tell the user to reinstall
  // dependencies before running whatever command was being run
  const declaredStyledComponentsVersion =
    studioPackageManifest.dependencies['styled-components'] ||
    studioPackageManifest.devDependencies['styled-components']

  if (!declaredStyledComponentsVersion) {
    const [file, ...args] = process.argv
    const deps = {'styled-components': wantedStyledComponentsVersionRange}
    await installDependencies(deps, context)

    // Re-run the same command (sanity dev/sanity build etc) after installation,
    // as it can have shifted the entire `node_modules` folder around, result in
    // broken assumptions about installation paths. This is a hack, and should be
    // solved properly.
    await execa(file, args, {cwd: studioPath, stdio: 'inherit'})
    return {didInstall: true, installedSanityVersion}
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
      \`npm install\`, \`yarn install\` or \`pnpm install\` to install it before re-running this command.
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

  return {didInstall: false, installedSanityVersion}
}

/**
 * Install the passed dependencies at the given version/version range,
 * prompting the user which package manager to use. We will try to detect
 * a package manager from files in the directory and show that as the default
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

function isComparableRange(range: string): boolean {
  return /^[\^~]?\d+(\.\d+)?(\.\d+)?$/.test(range)
}
