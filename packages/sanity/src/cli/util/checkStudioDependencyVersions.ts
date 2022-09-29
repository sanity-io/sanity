import fs from 'fs'
import path from 'path'
import semver, {SemVer} from 'semver'
import resolveFrom from 'resolve-from'
import {generateHelpUrl} from '@sanity/generate-help-url'
import type {PackageJson} from '@sanity/cli'

interface PackageInfo {
  name: string
  supported: string[]
  deprecatedBelow: null | string
  installed: SemVer
  isUnsupported: boolean
  isDeprecated: boolean
  isUntested: boolean
}

// NOTE: when doing changes here, also remember to update versions in help docs at
// https://admin.sanity.io/desk/docs;helpArticle;upgrade-packages
const PACKAGES = [
  {name: 'react', supported: ['^18'], deprecatedBelow: null},
  {name: 'react-dom', supported: ['^18'], deprecatedBelow: null},
]

export function checkStudioDependencyVersions(workDir: string): void {
  const manifest = readPackageJson(path.join(workDir, 'package.json'))
  const dependencies = {...manifest.dependencies, ...manifest.devDependencies}

  const packageInfo = PACKAGES.map((pkg): PackageInfo | false => {
    const dependency = dependencies[pkg.name]
    if (!dependency) {
      return false
    }

    const manifestPath = resolveFrom.silent(workDir, path.join(pkg.name, 'package.json'))
    const installed = semver.coerce(
      manifestPath ? readPackageJson(manifestPath).version : dependency.replace(/[\D.]/g, '')
    )

    if (!installed) {
      return false
    }

    const supported = pkg.supported.join(' || ')

    // "Untested" is usually the case where we have not upgraded the React version requirements
    // before a release, but given that is usually works in a backwards-compatible way, we want
    // to indicate that it's _untested_, not necessarily _unsupported_
    // Ex: Installed is react@19.0.0, but we've only _tested_ with react@^18
    const isUntested = !semver.satisfies(installed, supported) && semver.gtr(installed, supported)

    // "Unsupported" in that the installed version is _lower than_ the minimum version
    // Ex: Installed is react@15.0.0, but we require react@^16
    const isUnsupported = !semver.satisfies(installed, supported) && !isUntested

    // "Deprecated" in that we will stop supporting it at some point in the near future,
    // so users should be prompted to upgrade
    const isDeprecated = pkg.deprecatedBelow ? semver.ltr(installed, pkg.deprecatedBelow) : false

    return {
      ...pkg,
      installed,
      isUnsupported,
      isDeprecated,
      isUntested,
    }
  })

  const installedPackages = packageInfo.filter((inp): inp is PackageInfo => inp !== false)
  const unsupported = installedPackages.filter((pkg) => pkg.isUnsupported)
  const deprecated = installedPackages.filter((pkg) => !pkg.isUnsupported && pkg.isDeprecated)
  const untested = installedPackages.filter((pkg) => pkg.isUntested)

  if (deprecated.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(`
[WARN] The following package versions have been deprecated and should be upgraded:

  ${listPackages(deprecated)}

Support for these will be removed in a future release!

  ${getUpgradeInstructions(deprecated)}
`)
  }

  if (untested.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(`
[WARN] The following package versions have not yet been marked as supported:

  ${listPackages(untested)}

You _may_ encounter bugs while using these versions.

  ${getDowngradeInstructions(untested)}
`)
  }

  if (unsupported.length > 0) {
    // eslint-disable-next-line no-console
    console.error(`
[ERROR] The following package versions are no longer supported and needs to be upgraded:

  ${listPackages(unsupported)}

  ${getUpgradeInstructions(unsupported)}
`)
    process.exit(1)
  }
}

function listPackages(pkgs: PackageInfo[]) {
  return pkgs
    .map(
      (pkg) =>
        `${pkg.name} (installed: ${pkg.installed}, want: ${
          pkg.deprecatedBelow || pkg.supported.join(' || ')
        })`
    )
    .join('\n  ')
}

function getUpgradeInstructions(pkgs: PackageInfo[]) {
  const inst = pkgs
    .map((pkg) => {
      const [highestSupported] = pkg.supported
        .map((version) => (semver.coerce(version) || {version: ''}).version)
        .sort(semver.rcompare)

      return `"${pkg.name}@${highestSupported}"`
    })
    .join(' ')

  return `To upgrade, run either:

  yarn add ${inst}

  or

  npm install ${inst}

Read more at ${generateHelpUrl('upgrade-packages')}`
}

function getDowngradeInstructions(pkgs: PackageInfo[]) {
  const inst = pkgs
    .map((pkg) => {
      const [highestSupported] = pkg.supported
        .map((version) => (semver.coerce(version) || {version: ''}).version)
        .sort(semver.rcompare)

      return `"${pkg.name}@${highestSupported}"`
    })
    .join(' ')

  return `To downgrade, run either:

  yarn add ${inst}

  or

  npm install ${inst}`
}

function readPackageJson(filePath: string): PackageJson {
  try {
    // eslint-disable-next-line no-sync
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (err) {
    throw new Error(`Failed to read "${filePath}": ${err.message}`)
  }
}
