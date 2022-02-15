import path from 'path'
import promiseProps from 'promise-props-recursive'
import semver from 'semver'
import semverCompare from 'semver-compare'
import getLatestVersion from 'get-latest-version'
import * as pkg from '../../../package.json'
import type {CliCommandContext, PackageJson} from '../../types'
import {dynamicRequire} from '../../util/dynamicRequire'
import {getLocalVersion} from '../../util/getLocalVersion'

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
]

const defaultOptions: FindModuleVersionOptions = {
  includeCli: true,
}

interface PromisedModuleVersionInfo {
  name: string
  declared: string
  installed: string | undefined
  latest: Promise<string>
  latestInRange: Promise<string>
  isPinned: boolean
  isGlobal: boolean
}

interface ModuleVersionInfo {
  name: string
  declared: string
  installed: string | undefined
  latest: string
  latestInRange: string
  isPinned: boolean
  isGlobal: boolean
}

export interface ModuleVersionResult extends ModuleVersionInfo {
  needsUpdate: boolean
}

export interface FindModuleVersionOptions {
  includeCli?: boolean
  target?: string
}

export async function findSanityModuleVersions(
  context: CliCommandContext,
  options: FindModuleVersionOptions = {}
): Promise<ModuleVersionResult[]> {
  const {spinner} = context.output
  const {target, includeCli} = {...defaultOptions, ...options}

  // Declared @sanity modules and their wanted version ranges in package.json
  const sanityModules = filterSanityModules(getLocalManifest(context.workDir))

  // Figure out the latest versions which match the wanted range
  const resolveOpts = {includeCli, target}
  const spin = spinner('Resolving latest versions').start()
  const versions = await promiseProps<ModuleVersionInfo[]>(
    buildPackageArray(sanityModules, context.workDir, resolveOpts)
  )

  const packages = Object.values(versions)
  spin.stop()

  return packages.map((mod) => {
    const current = mod.installed || semver.minVersion(mod.declared)?.toString() || ''
    const needsUpdate =
      target === 'latest'
        ? semverCompare(current, mod.latest) === -1
        : mod.installed !== mod.latestInRange

    return {...mod, needsUpdate}
  })
}

function getLocalManifest(workDir: string): Partial<PackageJson> {
  try {
    return dynamicRequire(path.join(workDir, 'package.json'))
  } catch (err) {
    return {}
  }
}

function filterSanityModules(manifest: Partial<PackageJson>): Record<string, string> {
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
    }, {} as Record<string, string>)
}

function buildPackageArray(
  packages: Record<string, string>,
  workDir: string,
  options: FindModuleVersionOptions = {}
): PromisedModuleVersionInfo[] {
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
        isGlobal: false,
      }
    }),
  ]
}

function tryFindLatestVersion(pkgName: string, range: string) {
  return getLatestVersion(pkgName, {range, includeLatest: true})
    .then(({latest, inRange}) => ({latest, latestInRange: inRange}))
    .catch(() => ({latest: undefined, latestInRange: undefined}))
}

function isPinnedVersion(version: string): boolean {
  return /^\d+\.\d+\.\d+/.test(version)
}

/**
 * `2.27.3-cookieless-auth.34+8ba9c1504` =>
 * `2.27.3-cookieless-auth.34`
 */
function trimHash(version) {
  return version.replace(/\+[a-z0-9]{8,}$/, '')
}
