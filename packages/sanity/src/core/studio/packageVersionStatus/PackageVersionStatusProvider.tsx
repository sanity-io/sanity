import {memoize} from 'lodash'
import {type ReactNode, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {PackageVersionInfoContext} from 'sanity/_singletons'
import semver from 'semver'

import {getSanityImportMapUrl} from '../../environment/importMap'
import {SANITY_VERSION} from '../../version'
import {
  fetchLatestAutoUpdatingVersion,
  fetchLatestAvailableVersionForPackage,
} from './fetchLatestVersions'
import {parseImportMapModuleCdnUrl} from './utils'

// How often to check for new versions
const POLL_INTERVAL_MS = 1000 * 60 * 15 // check every 15 minutes
const CHECK_THROTTLE_TIME_MS = 1000 * 10 // prevent checking more often than every 10s

const noop = () => {}

type VersionCheckState = {
  lastCheckedAt: Date | null
  checking: boolean
}

// Debug flags for local testing
// Note: the debug code paths should be evaluated as const expressions and eliminated from the final bundle
const DEBUG_IMPORT_MAP = false
const DEBUG_CURRENT_VERSION = false
const DEBUG_LATEST_VERSION = false
const DEBUG_AUTO_UPDATE_VERSION = false

const DEBUG_VALUES = {
  currentVersion: '4.0.0-pr.10176',
  // alternative, non-appid based url: 'https://sanity-cdn.com/v1/modules/sanity/default/%5E3.80.1/t1754072932',
  importMapUrl: `https://sanity-cdn.com/v1/modules/by-app/appid123/t${Math.floor(Date.now() / 1000)}/%5E4.5.0/sanity`,
  autoUpdateVersion: '4.2.0-next.17',
  latestVersion: '4.5.5',
} as const

const getCurrentVersion = memoize(
  () => semver.parse(DEBUG_CURRENT_VERSION ? DEBUG_VALUES.currentVersion : SANITY_VERSION)!,
)

const getSanityImportMapEntryValue = memoize(() =>
  DEBUG_IMPORT_MAP ? DEBUG_VALUES.importMapUrl : getSanityImportMapUrl(),
)

const getImportMapInfo = memoize(() => {
  const sanityPackageImportMapEntryValue = getSanityImportMapEntryValue()

  if (!sanityPackageImportMapEntryValue) {
    return {
      valid: false as const,
      error: new Error('No import map entry for module "sanity" found in DOM'),
    }
  }
  return parseImportMapModuleCdnUrl(sanityPackageImportMapEntryValue)
})

export function PackageVersionStatusProvider({children}: {children: ReactNode}) {
  const importMapInfo = useMemo(() => {
    const result = getImportMapInfo()
    if (!result.valid) {
      console.warn(
        new Error(
          'Unable to extract version from import map, auto updates may not work as expected',
          {cause: result.error},
        ),
      )
    }
    return result
  }, [])
  const currentVersion = useMemo(() => getCurrentVersion(), [])

  const isAutoUpdating = Boolean(importMapInfo.valid)

  const lastCheckRef = useRef<number>(undefined)
  const [autoUpdatingVersionRaw, setAutoUpdatingVersionRaw] = useState<string>()
  const [latestTaggedVersionRaw, setLatestTaggedVersionRaw] = useState<string>()

  const autoUpdatingVersion = useMemo(
    () => (autoUpdatingVersionRaw ? semver.parse(autoUpdatingVersionRaw)! : undefined),
    [autoUpdatingVersionRaw],
  )
  const latestTaggedVersion = useMemo(
    () => (latestTaggedVersionRaw ? semver.parse(latestTaggedVersionRaw)! : undefined),
    [latestTaggedVersionRaw],
  )

  const [versionCheckStatus, setVersionCheckStatus] = useState<VersionCheckState>({
    lastCheckedAt: null,
    checking: false,
  })

  const fetchNewVersions = useCallback(async () => {
    if (
      lastCheckRef.current &&
      lastCheckRef.current + CHECK_THROTTLE_TIME_MS > new Date().getTime()
    ) {
      return
    }
    lastCheckRef.current = new Date().getTime()
    setVersionCheckStatus((current) => ({...current, checking: true}))

    // Note: in theory, and in the future, there might be multiple auto-updateable packages
    // but for now, we only care about the `sanity`-package
    Promise.all([
      DEBUG_AUTO_UPDATE_VERSION
        ? Promise.resolve(DEBUG_VALUES.autoUpdateVersion)
        : isAutoUpdating && importMapInfo.valid
          ? fetchLatestAutoUpdatingVersion({
              packageName: 'sanity',
              minVersion: semver.coerce(importMapInfo.minVersion, {includePrerelease: true})!,
              appId: importMapInfo.appId,
            })
          : Promise.resolve(undefined),
      DEBUG_LATEST_VERSION
        ? Promise.resolve(DEBUG_VALUES.latestVersion)
        : fetchLatestAvailableVersionForPackage({
            packageName: 'sanity',
            minVersion: importMapInfo.valid
              ? semver.coerce(importMapInfo.minVersion, {includePrerelease: true})!
              : currentVersion,
            tag: 'latest',
          }),
    ])
      .then(([nextAutoUpdatingVersion, nextLatestTaggedVersion]) => {
        setAutoUpdatingVersionRaw(nextAutoUpdatingVersion)
        setLatestTaggedVersionRaw(nextLatestTaggedVersion)
      })
      .finally(() => setVersionCheckStatus({lastCheckedAt: new Date(), checking: false}))
  }, [currentVersion, importMapInfo, isAutoUpdating])

  useEffect(() => {
    async function poll() {
      await fetchNewVersions()
    }

    // Run on first render
    poll()

    // Set interval for subsequent runs
    const intervalId = setInterval(poll, POLL_INTERVAL_MS)

    return () => clearInterval(intervalId)
  }, [fetchNewVersions])

  const contextValue = useMemo(
    () => ({
      isAutoUpdating,
      autoUpdatingVersion,
      baseVersion: importMapInfo.valid
        ? semver.coerce(importMapInfo.minVersion, {includePrerelease: true})!
        : undefined,
      latestTaggedVersion,
      currentVersion,
      checkForUpdates: isAutoUpdating ? fetchNewVersions : noop,
      versionCheckStatus,
    }),
    [
      isAutoUpdating,
      autoUpdatingVersion,
      importMapInfo,
      latestTaggedVersion,
      currentVersion,
      fetchNewVersions,
      versionCheckStatus,
    ],
  )
  return (
    <PackageVersionInfoContext.Provider value={contextValue}>
      {children}
    </PackageVersionInfoContext.Provider>
  )
}
