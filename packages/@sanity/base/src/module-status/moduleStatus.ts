import type {Observable} from 'rxjs'
import {map, shareReplay} from 'rxjs/operators'
import {sanityModuleVersions} from '../legacyParts'
import {versionedClient} from '../client/versionedClient'
import {CheckModuleVersionsOptions, VersionsResponse, ModuleStatusResponse} from './types'

// Used to keep track of lookups to prevent multiple requests
const CACHED_LOOKUPS = new Map<string, Observable<ModuleStatusResponse>>()

/**
 * Retrieve whether or not the installed (or passed) `@sanity`-modules are up
 * to date and/or supported, and if they are outdated; which versions are is
 * the latest available on npm vs which ones are installed locally.
 *
 * @param options Options to use for resolving module status
 * @internal Not a stable API yet
 */
export function checkModuleStatus(
  options?: CheckModuleVersionsOptions
): Observable<ModuleStatusResponse> {
  const {moduleVersions = getInstalledModules(), client = versionedClient} = options || {}
  const query = buildQueryString(moduleVersions)
  const hash = hashQuery(query.m)

  let request$ = CACHED_LOOKUPS.get(hash)
  if (request$) {
    return request$
  }

  request$ = client.observable
    .request<VersionsResponse>({
      url: '/versions',
      query,
      json: true,
      tag: 'module.version-check',
    })
    .pipe(
      map((result) => ({...result, installed: moduleVersions})),
      shareReplay(1)
    )

  CACHED_LOOKUPS.set(hash, request$)
  return request$
}

/**
 * Returns the currently installed version of the given module
 *
 * @param moduleName Name of module to get version number for
 * @internal Not a stable API yet
 */
export function getInstalledModuleVersion(moduleName: string): string | undefined {
  const versions = getInstalledModules()
  return versions[moduleName]
}

/**
 * Builds to: {m: ['@sanity/base@2.14.0', '@sanity/desk-tool@2.13.4']}
 * Serializes to: ?m=@sanity/base@2.14.0&m=@sanity/desk-tool@2.13.4
 */
function buildQueryString(versions: Record<string, string>): {m: string[]} {
  return {
    m: Object.keys(versions)
      .sort()
      .filter((pkg) => versions[pkg])
      .map((pkg) => `${pkg}@${versions[pkg]}`),
  }
}

/**
 * Returns an object of installed `@sanity`-modules and their installed version numbers
 */
function getInstalledModules(): Record<string, string> {
  // Ugly hack, but this allows for testing the version checker even when running
  // the latest module versions, by pretending we're using an outdated module
  const fakeOutdatedModule = false
  if (fakeOutdatedModule) {
    return {...sanityModuleVersions, '@sanity/base': '1.118.0'}
  }

  return sanityModuleVersions
}

/**
 * Reduce the module array string by stripping sanity-prefixes and joining them together
 */
function hashQuery(items: string[]): string {
  return items.join(',').replace(/@?sanity[/-]/g, '')
}
