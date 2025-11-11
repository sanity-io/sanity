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

// Note: in theory, and in the future, there might be multiple auto-updateable packages
// but for now, we only care about the `sanity`-package
const REFERENCE_PACKAGE = 'sanity'

export function PackageVersionStatusProvider({children}: {children: ReactNode}) {
  const importMapInfo = useMemo(() => {
    const importMapUrl = getSanityImportMapEntryValue()
    if (!importMapUrl) {
      return undefined
    }
    const result = parseImportMapModuleCdnUrl(importMapUrl)
    if (!result.valid) {
      console.warn(
        new Error(
          'Unable to extract version from import map, auto updates may not work as expected',
          {cause: result.error},
        ),
      )
    }
    return result.valid
      ? {...result, minVersion: semver.coerce(result.minVersion, {includePrerelease: true})!}
      : result
  }, [])
  const currentVersion = useMemo(() => getCurrentVersion(), [])

  const isAutoUpdating = Boolean(importMapInfo)

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

    // fetch the current version of the sanity package on the 'latest' tag
    const resolveLatestTaggedVersion = DEBUG_LATEST_VERSION
      ? Promise.resolve(DEBUG_VALUES.latestVersion)
      : fetchLatestAvailableVersionForPackage({
          packageName: REFERENCE_PACKAGE,
          minVersion: importMapInfo?.valid ? importMapInfo.minVersion : currentVersion,
          tag: 'latest',
        })

    // fetch the current version based on manage/brett configuration for appid
    const resolveAutoUpdatingVersion = DEBUG_AUTO_UPDATE_VERSION
      ? Promise.resolve(DEBUG_VALUES.autoUpdateVersion)
      : importMapInfo?.valid
        ? importMapInfo.appId
          ? fetchLatestAutoUpdatingVersion({
              packageName: REFERENCE_PACKAGE,
              minVersion: importMapInfo?.valid ? importMapInfo.minVersion : currentVersion,
              appId: importMapInfo.appId,
            })
          : // if studio is auto-updating but has no appId, the auto-updating version will be from `latest`
            resolveLatestTaggedVersion
        : undefined

    void Promise.all([resolveLatestTaggedVersion, resolveAutoUpdatingVersion])
      .then(([nextLatestVersion, nextAutoUpdatingVersion]) => {
        setAutoUpdatingVersionRaw(nextAutoUpdatingVersion)
        setLatestTaggedVersionRaw(nextLatestVersion)
      })
      .finally(() => setVersionCheckStatus({lastCheckedAt: new Date(), checking: false}))
  }, [currentVersion, importMapInfo])

  useEffect(() => {
    async function poll() {
      await fetchNewVersions()
    }

    // Run on first render
    void poll()

    // Set interval for subsequent runs
    const intervalId = setInterval(poll, POLL_INTERVAL_MS)

    return () => clearInterval(intervalId)
  }, [fetchNewVersions])

  const contextValue = useMemo(
    () => ({
      isAutoUpdating,
      autoUpdatingVersion,
      importMapInfo,
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
