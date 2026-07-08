import {type SemVer} from 'semver'

import {isStaging} from '../../environment/isStaging'

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
  /** The version the app is configured to update to (may not be servable for the import map's version range) */
  packageVersion?: string
  /** The exact version the module CDN will serve for the studio's import map URL, if provided by the server */
  resolvedVersion?: string
}

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
    const data = await res.json()
    return {
      packageVersion: data.packageVersion as string,
      resolvedVersion: data.resolvedVersion as string | undefined,
    }
  } catch (err) {
    // Best-effort check — the caller keeps previously known versions and retries on the next poll
    console.warn(
      new Error(
        `[sanity] Failed to fetch version for package "${packageName}" (using appId=${appId})`,
        {
          cause: err,
        },
      ),
    )
    return undefined
  }
}

export interface LatestVersionInfo {
  /** The latest version published to the tag (may not be servable for the import map's version range) */
  latest?: string
  /** The exact version the module CDN will serve for the studio's import map URL, if provided by the server */
  resolvedVersion?: string
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
    const data = await res.json()
    return {
      latest: data.latest as string,
      resolvedVersion: data.resolvedVersion as string | undefined,
    }
  } catch (err) {
    // Best-effort check — the caller keeps previously known versions and retries on the next poll
    console.warn(
      `[sanity] Failed to fetch version for package (using tag=${tag})`,
      packageName,
      'Error:',
      err,
    )
    return undefined
  }
}
