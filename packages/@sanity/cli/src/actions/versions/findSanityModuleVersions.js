import path from 'path'
import {values} from 'lodash'
import promiseProps from 'promise-props-recursive'
import semverCompare from 'semver-compare'
import getLatestVersion from 'get-latest-version'
import dynamicRequire from '../../util/dynamicRequire'
import getLocalVersion from '../../util/getLocalVersion'
import pkg from '../../../package.json'

/*
 * Some packages can introduce errors when updating. For example with Sanity UI
 * we are at the moment dependant upon the version of @sanity/ui that
 * @sanity/base imports to be the only version used since all imports of UI
 * need to use the same context.
 *
 * Put them in this array to make sure the upgrade script doesn't upgrade
 * them.
 */
const PACKAGES_TO_EXCLUDE = ['@sanity/ui']

const defaultOptions = {
  includeCli: true,
}

export default async (context, target, opts = {}) => {
  const {spinner} = context.output
  const options = Object.assign({}, defaultOptions, opts)

  const sanityModules = filterSanityModules(getLocalManifest(context.workDir))
  const resolveOpts = {includeCli: options.includeCli, target}
  const spin = spinner('Resolving latest versions').start()
  const versions = await promiseProps(
    buildPackageArray(sanityModules, context.workDir, resolveOpts)
  )

  const packages = values(versions)
  spin.stop()

  return packages.map((mod) => {
    mod.needsUpdate =
      target === 'latest'
        ? semverCompare(mod.version, mod.latest) === -1
        : mod.version !== mod.latest
    return mod
  })
}

function getLocalManifest(workDir) {
  try {
    return dynamicRequire(path.join(workDir, 'package.json'))
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
    .filter((mod) => mod.indexOf('@sanity/') === 0)
    .filter((mod) => !PACKAGES_TO_EXCLUDE.includes(mod))
    .sort()

  return sanityDeps.reduce((versions, dependency) => {
    const version = dependencies[dependency]
    versions[dependency] = version.indexOf('^') === 0 ? 'latest' : version
    return versions
  }, {})
}

function buildPackageArray(packages, workDir, options = {}) {
  const {includeCli, target} = options

  const initial = []
  if (includeCli) {
    initial.push({
      name: pkg.name,
      version: pkg.version,
      latest: tryFindLatestVersion(pkg.name, target),
    })
  }

  return Object.keys(packages).reduce((result, pkgName) => {
    result.push({
      name: pkgName,
      version: getLocalVersion(pkgName, workDir) || '???',
      latest: tryFindLatestVersion(pkgName, target),
    })
    return result
  }, initial)
}

function tryFindLatestVersion(pkgName, range = 'latest') {
  return getLatestVersion(pkgName, range).catch(() => 'unknown')
}
