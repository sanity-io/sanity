import path from 'path'
import {values} from 'lodash'
import promiseProps from 'promise-props-recursive'
import getPackageJson from 'package-json'
import semverCompare from 'semver-compare'
import getLocalVersion from '../../util/getLocalVersion'
import pkg from '../../../package.json'

export default async (context, target) => {
  const {spinner} = context.output

  const sanityModules = filterSanityModules(
    getLocalManifest(context.workDir)
  )

  const resolveOpts = {includeCli: true, target}
  const spin = spinner('Resolving latest versions').start()
  const versions = await promiseProps(
    buildPackageArray(sanityModules, context.workDir, resolveOpts)
  )

  const packages = values(versions)
  spin.stop()

  return packages.map(mod => {
    mod.needsUpdate = target === 'latest'
      ? semverCompare(mod.version, mod.latest) === -1
      : mod.version !== mod.latest
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
  const dependencies = Object.assign(
    {},
    manifest.dependencies || {},
    manifest.devDependencies || {}
  )

  const sanityDeps = Object.keys(dependencies)
    .filter(mod => mod.indexOf('@sanity/') === 0)
    .sort()

  return sanityDeps.reduce((versions, dependency) => {
    const version = dependencies[dependency]
    versions[dependency] = version.indexOf('^') === 0 ? 'latest' : version
    return versions
  }, {})
}

function buildPackageArray(packages, workDir, options = {}) {
  const {includeCli, target} = options

  const initial = includeCli ? [{
    name: pkg.name,
    version: pkg.version,
    latest: tryFindLatestVersion(pkg.name, target)
  }] : []

  return Object.keys(packages).reduce((result, pkgName) => {
    result.push({
      name: pkgName,
      version: getLocalVersion(pkgName, workDir) || '???',
      latest: tryFindLatestVersion(pkgName, target)
    })
    return result
  }, initial)
}

function tryFindLatestVersion(pkgName, range = 'latest') {
  return getLatestVersion(pkgName, range).catch(() => 'unknown')
}

function getLatestVersion(pkgName, range = 'latest') {
  return getPackageJson(pkgName.toLowerCase(), {version: range})
    .then(data => data.version)
}
