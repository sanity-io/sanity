import path from 'node:path'

import {type CliCommandContext} from '@sanity/cli'

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
  const [studioPackageManifest, installedSanityVersion] = await Promise.all([
    await readPackageManifest(path.join(studioPath, 'package.json'), defaultStudioManifestProps),
    await readModuleVersion(studioPath, 'sanity'),
  ])

  // Retrieve the version of the 'sanity' dependency
  if (!installedSanityVersion) {
    throw new Error('Failed to read the installed sanity version.')
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
