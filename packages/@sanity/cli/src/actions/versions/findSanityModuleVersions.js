import path from 'path'
import values from 'lodash/values'
import promiseProps from 'promise-props-recursive'
import getPackageJson from 'package-json'
import semverCompare from 'semver-compare'
import getLocalVersion from '../../util/getLocalVersion'
import pkg from '../../../package.json'

export default async context => {
  const {spinner} = context.output

  const sanityModules = filterSanityModules(
    getLocalManifest(context.workDir)
  )

  const spin = spinner('Resolving latest versions').start()
  const packages = values(await promiseProps(buildPackageArray(
    sanityModules,
    context.workDir
  , {includeCli: true})))
  spin.stop()

  return packages.map(mod => {
    mod.isOutdated = semverCompare(mod.version, mod.latest) === -1
    return mod
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

function buildPackageArray(packages, workDir, options = {}) {
  const {includeCli} = options
  return packages.reduce((result, pkgName) => {
    result.push({
      name: pkgName,
      version: getLocalVersion(pkgName, workDir) || '???',
      latest: tryFindLatestVersion(pkgName)
    })
    return result
  }, includeCli ? [{
    name: pkg.name,
    version: pkg.version,
    latest: tryFindLatestVersion(pkg.name)
  }] : [])
}

function tryFindLatestVersion(pkgName) {
  return getLatestVersion(pkgName).catch(() => 'unknown')
}

async function getLatestVersion(pkgName, range = 'latest') {
  return getPackageJson(pkgName.toLowerCase(), range)
    .then(data => data.version)
}
