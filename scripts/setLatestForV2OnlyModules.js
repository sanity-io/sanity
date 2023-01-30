/* eslint-disable no-sync, no-console, import/no-dynamic-require */
const fs = require('fs')
const path = require('path')
const execa = require('execa')
const semver = require('semver')

main()

async function main() {
  const pkgsPath = path.join(__dirname, '..', 'packages', '@sanity')
  const pkgs = fs
    .readdirSync(pkgsPath)
    .filter((pkg) => fs.statSync(path.join(pkgsPath, pkg)).isDirectory())

  for (const pkg of pkgs) {
    const pkgName = `@sanity/${pkg}`
    const latestVersion = (await execa('npm', ['show', pkgName, 'version'])).stdout.trim()

    // For 3.x modules, we want to keep that as latest
    if (!latestVersion.startsWith('2.')) {
      continue
    }

    // If on 2.x range, check if the in-repo version is newer than what is published as `latest`.
    // This happens because we publish blindly with `--tag v2`, but for modules that were removed
    // in v3, we actually want the latest 2.x version to be the latest version.
    const localVersion = require(path.join(pkgsPath, pkg, 'package.json')).version
    if (
      !localVersion ||
      !localVersion.startsWith('2.') ||
      semver.gte(latestVersion, localVersion)
    ) {
      console.log('%s is at latest already, skipping', pkgName)
      continue
    }

    console.log(
      '%s is newer locally (%s) than latest (%s) - adjusting `latest` tag',
      pkgName,
      localVersion,
      latestVersion
    )

    console.log(
      (await execa('npm', ['dist-tag', 'add', `${pkgName}@${localVersion}`, 'latest'])).stdout
    )
  }
}
