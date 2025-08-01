import {type ReactNode, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {PackageVersionInfoContext} from 'sanity/_singletons'
import semver from 'semver'

import {hasSanityPackageInImportMap} from '../../environment/hasSanityPackageInImportMap'
import {SANITY_VERSION} from '../../version'
import {fetchLatestVersions} from './fetchLatestVersions'

// How often to check for new versions
const POLL_INTERVAL_MS = 1000 * 60 * 30 // check every 30 minutes
const CHECK_THROTTLE_TIME_MS = 1000 * 10 // prevent checking more often than every 10s

const currentPackageVersions = [
  {
    name: 'sanity',
    current: SANITY_VERSION,
  },
]

const noop = () => {}

type VersionCheckState = {
  lastCheckedAt: Date | null
  checking: boolean
}
type PackageVersionInfo = {
  name: string
  current: string
  available?: string
}
// flip this to debug auto-updates locally
const DEBUG = false

export function PackageVersionStatusProvider({children}: {children: ReactNode}) {
  const isAutoUpdating = hasSanityPackageInImportMap() || DEBUG

  const lastCheckRef = useRef<number>(undefined)
  const [packageVersionInfo, setPackageVersionInfo] =
    useState<PackageVersionInfo[]>(currentPackageVersions)

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
    fetchLatestVersions(currentPackageVersions)
      .then((latestPackageVersions) =>
        setPackageVersionInfo(
          DEBUG
            ? [{name: 'sanity', current: SANITY_VERSION, available: '4.2.0'}]
            : latestPackageVersions,
        ),
      )
      .finally(() => setVersionCheckStatus({lastCheckedAt: new Date(), checking: false}))
  }, [])

  useEffect(() => {
    if (!isAutoUpdating) return undefined

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
      checkForUpdates: isAutoUpdating ? fetchNewVersions : noop,
      packageVersionInfo: packageVersionInfo.map((p) => ({
        ...p,
        canUpdate: p.available ? semver.lt(p.current, p.available) : false,
      })),
      versionCheckStatus,
    }),
    [isAutoUpdating, fetchNewVersions, packageVersionInfo, versionCheckStatus],
  )
  return (
    <PackageVersionInfoContext.Provider value={contextValue}>
      {children}
    </PackageVersionInfoContext.Provider>
  )
}
