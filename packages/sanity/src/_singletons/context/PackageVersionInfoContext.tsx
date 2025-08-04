import {createContext} from 'sanity/_createContext'

/**
 * @hidden
 * @internal
 */
export type PackageVersionInfo = {
  name: string
  current: string
  available?: string
  canUpdate: boolean
}
/**
 * @hidden
 * @internal
 */
export type PackageVersionInfoContextValue = {
  checkForUpdates: () => void
  isAutoUpdating: boolean
  packageVersionInfo: PackageVersionInfo[]
  versionCheckStatus: {lastCheckedAt: Date | null; checking: boolean}
}
/**
 *
 * @hidden
 * @internal
 */
export const PackageVersionInfoContext = createContext<PackageVersionInfoContextValue>(
  'sanity/_singletons/context/package-version-info',
  {
    isAutoUpdating: false,
    checkForUpdates: () => {},
    packageVersionInfo: [],
    versionCheckStatus: {lastCheckedAt: null, checking: false},
  },
)
