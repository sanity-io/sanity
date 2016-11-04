import path from 'path'
import chalk from 'chalk'
import values from 'lodash/values'
import padEnd from 'lodash/padEnd'
import padStart from 'lodash/padStart'
import promiseProps from 'promise-props-recursive'
import latestVersion from 'latest-version'
import getLocalVersion from '../../util/getLocalVersion'
import pkg from '../../../package.json'

export default async (args, context) => {
  const {spinner} = context.output

  const sanityModules = filterSanityModules(
    getLocalManifest(context.workDir)
  )

  const spin = spinner('Resolving latest versions').start()
  const packages = await promiseProps(buildPackageArray(
    sanityModules,
    context.workDir
  ))
  spin.stop()

  const versions = values(packages)

  const nameLength = versions.reduce(longestProp('name'), 0)
  const versionLength = versions.reduce(longestProp('version'), 0)

  const formatName = name => padEnd(name, nameLength + 1).replace(
    /^@sanity\/(.*)/,
    `${chalk.yellow('@sanity/')}${chalk.cyan('$1')}`
  )

  versions.forEach(mod => {
    const version = padStart(mod.version, versionLength)
    const latest = mod.version === mod.latest
      ? chalk.green('(up to date)')
      : `(latest: ${chalk.yellow(mod.latest)})`
    context.output.print(`${formatName(mod.name)} ${version} ${latest}`)
  })
}

function getLocalManifest(workDir) {
  try {
    return require(path.join(workDir, 'package.json'))
  } catch (err) {
    return {}
  }
}

function filterSanityModules(manifest) {
  return ([]
    .concat(Object.keys(manifest.dependencies || {}))
    .concat(Object.keys(manifest.devDependencies || {}))
    .filter(mod => mod.indexOf('@sanity/') === 0)
    .sort()
  )
}

function buildPackageArray(packages, workDir) {
  return packages.reduce((result, pkgName) => {
    result.push({
      name: pkgName,
      version: getLocalVersion(pkgName, workDir),
      latest: tryFindLatestVersion(pkgName)
    })
    return result
  }, [{
    name: pkg.name,
    version: pkg.version,
    latest: tryFindLatestVersion(pkg.name)
  }])
}

function tryFindLatestVersion(pkgName) {
  return latestVersion(pkgName).catch(() => 'unknown')
}

function longestProp(prop) {
  return (max, obj) => Math.max(max, obj[prop].length)
}
