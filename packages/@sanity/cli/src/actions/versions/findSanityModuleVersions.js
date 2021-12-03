import path from 'path'
import promiseProps from 'promise-props-recursive'
import semver from 'semver'
import semverCompare from 'semver-compare'
import getLatestVersion from 'get-latest-version'
import {dynamicRequire} from '../../util/dynamicRequire'
import getLocalVersion from '../../util/getLocalVersion'
import pkg from '../../../package.json'

/*
 * The `sanity upgrade` command should only be responsible for upgrading the
 * _studio_ related dependencies. Modules like @sanity/block-content-to-react
 * shouldn't be upgraded using the same tag/range as the other studio modules.
 *
 * We don't have a guaranteed list of the "studio modules", so instead we
 * explicitly exclude certain modules from being upgraded.
 */
const PACKAGES_TO_EXCLUDE = [
  '@sanity/block-content-to-html',
  '@sanity/block-content-to-react',
  '@sanity/block-tools',
  '@sanity/client',
  '@sanity/icons',
  '@sanity/logos',
  '@sanity/ui',
]

const defaultOptions = {
  includeCli: true,
}

export default async function findSanityModuleVersions(context, opts = {}) {
  const {spinner} = context.output
  const options = {...defaultOptions, ...opts}
  const {target, includeCli} = options

  // Declared @sanity modules and their wanted version ranges in package.json
  const sanityModules = filterSanityModules(getLocalManifest(context.workDir))

  // Figure out the latest versions which match the wanted range
  const resolveOpts = {includeCli, target}
  const spin = spinner('Resolving latest versions').start()
  const versions = await promiseProps(
    buildPackageArray(sanityModules, context.workDir, resolveOpts)
  )

  const packages = Object.values(versions)
  spin.stop()

  return packages.map((mod) => {
    const current = mod.installed || tryGetMinVersion(mod.declared)
    mod.needsUpdate =
      target === 'latest'
        ? Boolean(current && semverCompare(current, mod.latest) === -1)
        : Boolean(mod.latestInRange && mod.installed !== mod.latestInRange)
    return mod
  })
}

function tryGetMinVersion(version) {
  try {
    return semver.minVersion(version).toString()
  } catch (err) {
    return undefined
  }
}

function getLocalManifest(workDir) {
  try {
    return dynamicRequire(path.join(workDir, 'package.json'))
  } catch (err) {
    return {}
  }
}

function filterSanityModules(manifest) {
  const dependencies = {
    ...manifest.dependencies,
    ...manifest.devDependencies,
  }

  return Object.keys(dependencies)
    .filter((mod) => mod.startsWith('@sanity/'))
    .filter((mod) => !PACKAGES_TO_EXCLUDE.includes(mod))
    .sort()
    .reduce((versions, dependency) => {
      versions[dependency] = dependencies[dependency]
      return versions
    }, {})
}

function buildPackageArray(packages, workDir, options = {}) {
  const {includeCli, target} = options

  const modules = []
  if (includeCli) {
    const [cliMajor] = pkg.version.split('.')
    const latest = tryFindLatestVersion(pkg.name, target || `^${cliMajor}`)
    modules.push({
      name: pkg.name,
      declared: `^${pkg.version}`,
      installed: trimHash(pkg.version),
      latest: latest.then((versions) => versions.latest),
      latestInRange: latest.then((versions) => versions.latestInRange),
      isPinned: false,
      isGlobal: true,
    })
  }

  return [
    ...modules,
    ...Object.keys(packages).map((pkgName) => {
      const latest = tryFindLatestVersion(pkgName, target || packages[pkgName] || 'latest')
      const localVersion = getLocalVersion(pkgName, workDir)
      return {
        name: pkgName,
        declared: packages[pkgName],
        installed: localVersion ? trimHash(localVersion) : undefined,
        latest: latest.then((versions) => versions.latest),
        latestInRange: latest.then((versions) => versions.latestInRange),
        isPinned: isPinnedVersion(packages[pkgName]),
      }
    }),
  ]
}

function tryFindLatestVersion(pkgName, range) {
  return getLatestVersion(pkgName, {range, includeLatest: true})
    .then(({latest, inRange}) => ({latest, latestInRange: inRange}))
    .catch(() => ({latest: undefined, latestInRange: undefined}))
}

function isPinnedVersion(version) {
  return /^\d+\.\d+\.\d+/.test(version)
}

/**
 * `2.27.3-cookieless-auth.34+8ba9c1504` =>
 * `2.27.3-cookieless-auth.34`
 */
function trimHash(version) {
  return version.replace(/\+[a-z0-9]{8,}$/, '')
}
