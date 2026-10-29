import memoize from 'lodash-es/memoize.js'
import {type ReactNode, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {PackageVersionInfoContext} from 'sanity/_singletons'
import semver from 'semver'

import {getSanityImportMapUrl} from '../../environment/importMap'
import {SANITY_VERSION} from '../../version'
import {
  type AutoUpdatingVersionInfo,
  fetchLatestAutoUpdatingVersion,
  fetchLatestAvailableVersionForPackage,
  type LatestVersionInfo,
} from './fetchLatestVersions'
import {type DeprecatedVersions, getVersionDeprecation, parseImportMapModuleCdnUrl} from './utils'

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
const DEBUG_DEPRECATED_VERSIONS = false

const DEBUG_VALUES = {
  currentVersion: '5.20.0',
  // alternative, non-appid based url: 'https://sanity-cdn.com/v1/modules/sanity/default/%5E3.80.1/t1754072932',
  importMapUrl: `https://sanity-cdn.com/v1/modules/by-app/appid123/t${Math.floor(Date.now() / 1000)}/%5E5.20.1/sanity`,
  autoUpdateVersion: '5.20.1',
  latestVersion: '6.14.1',
  // deprecates both the running version and the debug auto-update target, so the warning shows
  // for the "not auto-updating" case and for the "pinned to a deprecated version" case
  deprecatedVersions: {
    [SANITY_VERSION]: {reason: 'Contains a bug that may cause data loss in array inputs'},
    '4.2.0-next.17': {reason: 'Contains a bug that may cause data loss in array inputs'},
  } as DeprecatedVersions,
} as const

const getCurrentVersion = memoize(() =>
  semver.parse(DEBUG_CURRENT_VERSION ? DEBUG_VALUES.currentVersion : SANITY_VERSION)!,
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
  const [fetchedDeprecatedVersions, setDeprecatedVersions] = useState<
    DeprecatedVersions | undefined
  >()
  // read the debug value per render (not as initial state) so flipping the flag under HMR takes effect
  const deprecatedVersions = DEBUG_DEPRECATED_VERSIONS
    ? DEBUG_VALUES.deprecatedVersions
    : fetchedDeprecatedVersions

  // The version the module CDN will serve for the studio's import map URL on reload (resolved
  // within the URL's version range, including explicitly allowed major jumps). Never base this
  // on `latest` — it ignores the range and reloading can't reach it.
  const autoUpdatingVersion = useMemo(
    () =>
      autoUpdatingVersionRaw ? (semver.parse(autoUpdatingVersionRaw) ?? undefined) : undefined,
    [autoUpdatingVersionRaw],
  )
  const latestTaggedVersion = useMemo(
    () =>
      latestTaggedVersionRaw ? (semver.parse(latestTaggedVersionRaw) ?? undefined) : undefined,
    [latestTaggedVersionRaw],
  )

  // Only warn when a reload won't fix it: an auto-updating studio is judged by the version a
  // reload applies (deprecated => pinned to it via manage), a non-auto-updating one by the
  // version it runs.
  const versionDeprecation = useMemo(() => {
    if (isAutoUpdating) {
      const deprecation = getVersionDeprecation(deprecatedVersions, autoUpdatingVersion)
      return deprecation && autoUpdatingVersion
        ? {version: autoUpdatingVersion, reason: deprecation.reason, isPinned: true}
        : undefined
    }
    const deprecation = getVersionDeprecation(deprecatedVersions, currentVersion)
    return deprecation
      ? {version: currentVersion, reason: deprecation.reason, isPinned: false}
      : undefined
  }, [isAutoUpdating, deprecatedVersions, autoUpdatingVersion, currentVersion])

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
      ? Promise.resolve<LatestVersionInfo>({
          latest: DEBUG_VALUES.latestVersion,
          packageVersion: DEBUG_VALUES.latestVersion,
        })
      : fetchLatestAvailableVersionForPackage({
          packageName: REFERENCE_PACKAGE,
          minVersion: importMapInfo?.valid ? importMapInfo.minVersion : currentVersion,
          tag: 'latest',
        })

    // fetch the current version based on manage/brett configuration for appid
    const resolveAutoUpdatingVersion = DEBUG_AUTO_UPDATE_VERSION
      ? Promise.resolve<AutoUpdatingVersionInfo>({packageVersion: DEBUG_VALUES.autoUpdateVersion})
      : importMapInfo?.valid
        ? importMapInfo.appId
          ? fetchLatestAutoUpdatingVersion({
              packageName: REFERENCE_PACKAGE,
              minVersion: importMapInfo?.valid ? importMapInfo.minVersion : currentVersion,
              appId: importMapInfo.appId,
            })
          : // if studio is auto-updating but has no appId, the auto-updating version comes from the
            // latest-channel metadata — its `packageVersion` is resolved for the same version range
            resolveLatestTaggedVersion
        : undefined

    void Promise.all([resolveLatestTaggedVersion, resolveAutoUpdatingVersion])
      .then(([nextLatestVersion, nextAutoUpdatingVersion]) => {
        // `fetchLatestVersions` resolves `undefined` on a failed fetch (rather
        // than rejecting), so only overwrite state when we actually got a value.
        // This keeps the previously known versions on a transient failure and
        // we try again on the next tick.
        if (nextAutoUpdatingVersion) {
          setAutoUpdatingVersionRaw(nextAutoUpdatingVersion.packageVersion)
        }
        if (nextLatestVersion?.latest) {
          setLatestTaggedVersionRaw(nextLatestVersion.latest)
        }
        // Both endpoints describe the same package, so either response's deprecation list is
        // authoritative. Only overwrite when a response actually carried the field, so a
        // response without it (or a failed fetch) keeps the last known list.
        const nextDeprecated = nextAutoUpdatingVersion?.deprecated ?? nextLatestVersion?.deprecated
        if (nextDeprecated) {
          setDeprecatedVersions(nextDeprecated)
        }
      })
      .catch((err) => {
        // Best-effort version poll — keep the previously known versions
        // and try again on the next tick.
        console.warn('[sanity] Failed to check for new studio versions:', err)
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
      versionDeprecation,
      checkForUpdates: isAutoUpdating ? fetchNewVersions : noop,
      versionCheckStatus,
    }),
    [
      isAutoUpdating,
      autoUpdatingVersion,
      importMapInfo,
      latestTaggedVersion,
      currentVersion,
      versionDeprecation,
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
