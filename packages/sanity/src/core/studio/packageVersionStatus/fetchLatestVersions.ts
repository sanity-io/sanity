import {type SemVer} from 'semver'

import {isStaging} from '../../environment/isStaging'
import {type DeprecatedVersions, parseDeprecatedVersions} from './utils'

// e2e tests also check for this URL pattern -- please update if it changes!
const MODULES_URL_VERSION = 'v1'
const MODULES_HOST = isStaging ? 'https://sanity-cdn.work' : 'https://sanity-cdn.com'
const MODULES_URL = `${MODULES_HOST}/${MODULES_URL_VERSION}/modules`

function currentUnixTimestamp() {
  return Math.floor(Date.now() / 1000)
}

function getAppIdModuleUrl({
  packageName,
  minVersion,
  appId,
}: {
  packageName: string
  minVersion: SemVer
  appId: string
}) {
  const timestamp = currentUnixTimestamp()
  return `${MODULES_URL}/by-app/${appId}/t${timestamp}/^${minVersion.version}/${packageName}`
}

function getModuleUrl({
  packageName,
  minVersion,
  tag = 'latest',
}: {
  packageName: string
  minVersion: SemVer
  tag?: string
}) {
  const timestamp = currentUnixTimestamp()
  return `${MODULES_URL}/${packageName}/${tag}/^${minVersion.version}/t${timestamp}`
}

export interface AutoUpdatingVersionInfo {
  /** The version the module CDN will serve for this app's import map URL on reload */
  packageVersion: string
  /** Deprecated versions of this package, when included in the response */
  deprecated?: DeprecatedVersions
}

/**
 * Resolves the version the module CDN will serve for the studio's import map URL on reload
 * (the `packageVersion` of the app's module metadata)
 */
export const fetchLatestAutoUpdatingVersion = async (options: {
  packageName: string
  minVersion: SemVer
  appId: string
}): Promise<AutoUpdatingVersionInfo | undefined> => {
  const {packageName, minVersion, appId} = options

  try {
    // On every request it should be a new timestamp, so we can actually get a new version notification
    const res = await fetch(getAppIdModuleUrl({appId, packageName, minVersion}), {
      headers: {
        accept: 'application/json',
      },
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`)
    }
    // `return await` (not bare `return`) so a JSON parse rejection is
    // caught by this try/catch instead of escaping to the caller.
    const data = await res.json()
    return {
      packageVersion: data.packageVersion as string,
      deprecated: parseDeprecatedVersions(data.deprecated),
    }
  } catch (err) {
    console.error(
      new Error(`Failed to fetch version for package "${packageName}" (using appId=${appId})`, {
        cause: err,
      }),
    )
    return undefined
  }
}

export interface LatestVersionInfo {
  /** The latest version published to the tag, ignoring the version range — for messaging only, a reload may not serve it */
  latest?: string
  /** The version the module CDN will serve for this URL (resolved within the version range) */
  packageVersion: string
  /** Deprecated versions of this package, when included in the response */
  deprecated?: DeprecatedVersions
}

export const fetchLatestAvailableVersionForPackage = async (options: {
  packageName: string
  minVersion: SemVer
  tag?: string
}): Promise<LatestVersionInfo | undefined> => {
  const {packageName, minVersion, tag = 'latest'} = options
  try {
    // On every request it should be a new timestamp, so we can actually get a new version notification
    const res = await fetch(getModuleUrl({packageName, minVersion, tag}), {
      headers: {
        accept: 'application/json',
      },
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`)
    }
    // `return await` (not bare `return`) so a JSON parse rejection is
    // caught by this try/catch instead of escaping to the caller.
    const data = await res.json()
    return {
      latest: data.latest as string,
      packageVersion: data.packageVersion as string,
      deprecated: parseDeprecatedVersions(data.deprecated),
    }
  } catch (err) {
    console.error(
      `Failed to fetch version for package (using tag=${tag})`,
      packageName,
      'Error:',
      err,
    )
    return undefined
  }
}
