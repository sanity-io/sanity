const path = require('path')
const semver = require('semver')
const resolveFrom = require('resolve-from')
const generateHelpUrl = require('@sanity/generate-help-url')

// NOTE: when doing changes here, also remember to update versions in help docs at
// https://docs.sanity.studio/production/desk/edit/helpArticle/upgrade-packages
const PACKAGES = [
  {name: 'react', minVersion: '^16.9', deprecatedBelow: null, maxVersion: null /*todo*/},
  {name: 'react-dom', minVersion: '^16.9', deprecatedBelow: null, maxVersion: null /*todo*/},
]

module.exports = (workDir) => {
  const manifest = require(path.join(workDir, 'package.json'))
  const dependencies = Object.assign({}, manifest.dependencies, manifest.devDependencies)

  const installedPackages = PACKAGES.map((pkg) => {
    if (!dependencies[pkg.name]) {
      return null
    }

    const manifestPath = resolveFrom.silent(workDir, path.join(pkg.name, 'package.json'))
    const installedVersion = manifestPath
      ? // eslint-disable-next-line import/no-dynamic-require
        require(manifestPath).version
      : dependencies[pkg].replace(/[\D.]/g, '')

    return {
      ...pkg,
      installed: installedVersion,
      isUnsupported:
        pkg.minVersion && !semver.satisfies(semver.coerce(installedVersion), pkg.minVersion),
      isDeprecated: pkg.deprecatedBelow && semver.ltr(installedVersion, pkg.deprecatedBelow),
    }
  }).filter(Boolean)

  const unsupported = installedPackages.filter((pkg) => pkg.isUnsupported)
  const deprecated = installedPackages.filter((pkg) => !pkg.isUnsupported && pkg.isDeprecated)

  if (deprecated.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(`
[WARN] The following package versions have been deprecated and should be upgraded:

  ${listPackages(deprecated)}

Support for these will be removed in a future release!

  ${getUpgradeInstructions(deprecated)}
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

function listPackages(pkgs) {
  return pkgs
    .map(
      (pkg) =>
        `${pkg.name} (installed: ${pkg.installed}, want: ${pkg.deprecatedBelow || pkg.minVersion})`
    )
    .join('\n  ')
}
function getUpgradeInstructions(pkgs) {
  const inst = pkgs.map((pkg) => `"${pkg.name}@${pkg.minVersion}"`).join(' ')

  return `To upgrade run either:

  yarn add ${inst}

  or

  npm install ${inst}

Read more at ${generateHelpUrl('upgrade-packages')}`
}
