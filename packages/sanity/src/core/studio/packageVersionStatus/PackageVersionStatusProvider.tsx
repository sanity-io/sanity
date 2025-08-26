import {type ReactNode, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {PackageVersionInfoContext} from 'sanity/_singletons'
import semver from 'semver'

import {getSanityImportMapUrl} from '../../environment/importMap'
import {SANITY_VERSION} from '../../version'
import {fetchLatestVersionForPackage} from './fetchLatestVersions'
import {getBaseVersionFromModuleCDNUrl} from './utils'

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
  importMapUrl: 'https://sanity-cdn.com/v1/modules/by-app/appid123/t1755876954/%5E4.5.0/sanity',
  autoUpdateVersion: '4.2.0-next.17',
  latestVersion: '4.5.5',
} as const

const CURRENT_VERSION = DEBUG_CURRENT_VERSION ? DEBUG_VALUES.currentVersion : SANITY_VERSION

export function PackageVersionStatusProvider({children}: {children: ReactNode}) {
  const sanityPackageImportMapEntryValue = useMemo(
    () => (DEBUG_IMPORT_MAP ? DEBUG_VALUES.importMapUrl : getSanityImportMapUrl()),
    [],
  )

  const currentVersion = useMemo(() => semver.parse(CURRENT_VERSION)!, [])

  const baseVersion =
    useMemo(
      () =>
        sanityPackageImportMapEntryValue
          ? semver.coerce(getBaseVersionFromModuleCDNUrl(sanityPackageImportMapEntryValue), {
              includePrerelease: true,
            })
          : currentVersion!,
      [currentVersion, sanityPackageImportMapEntryValue],
    ) || undefined

  const isAutoUpdating = Boolean(sanityPackageImportMapEntryValue)

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
        : isAutoUpdating && baseVersion
          ? fetchLatestVersionForPackage('sanity', baseVersion.version)
          : Promise.resolve(undefined),
      DEBUG_LATEST_VERSION
        ? Promise.resolve(DEBUG_VALUES.latestVersion)
        : baseVersion
          ? fetchLatestVersionForPackage('sanity', baseVersion.version, 'latest')
          : Promise.resolve(undefined),
    ])
      .then(([nextAutoUpdatingVersion, nextLatestTaggedVersion]) => {
        setAutoUpdatingVersionRaw(nextAutoUpdatingVersion)
        setLatestTaggedVersionRaw(nextLatestTaggedVersion)
      })
      .finally(() => setVersionCheckStatus({lastCheckedAt: new Date(), checking: false}))
  }, [baseVersion, isAutoUpdating])

  useEffect(() => {
    async function poll() {
      await fetchNewVersions()
    }

    // Run on first render
    poll()

    // Set interval for subsequent runs
    const intervalId = setInterval(poll, POLL_INTERVAL_MS)

    return () => clearInterval(intervalId)
  }, [fetchNewVersions, isAutoUpdating])

  const contextValue = useMemo(
    () => ({
      isAutoUpdating,
      autoUpdatingVersion,
      baseVersion,
      latestTaggedVersion,
      currentVersion,
      checkForUpdates: isAutoUpdating ? fetchNewVersions : noop,
      versionCheckStatus,
    }),
    [
      isAutoUpdating,
      autoUpdatingVersion,
      baseVersion,
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
