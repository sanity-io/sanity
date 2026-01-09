import {createContext} from 'sanity/_createContext'
import type {SemVer} from 'semver'

/**
 * @hidden
 * @internal
 */
export type PackageVersionInfoContextValue = {
  /**
   * Request a new update check
   */
  checkForUpdates: () => void

  /**
   * Status of version check (i.e. are we currently checking for updates)
   */
  versionCheckStatus: {lastCheckedAt: Date | null; checking: boolean}

  /**
   * Whether this Studio is configured to be auto-updating
   */
  isAutoUpdating: boolean

  /**
   * If an importmap for the sanity module exists in the DOM, includes details
   * will be undefined if no importmap is found
   */
  importMapInfo?: {valid: false; error: Error} | {valid: true; minVersion: SemVer; appId?: string}

  /**
   * What is the version tagged as latest (periodically checked)
   */
  latestTaggedVersion?: SemVer

  /**
   * What version is the Studio currently running
   */
  currentVersion: SemVer

  /**
   * What is the current auto-updating version (as periodically resolved via module server and configured via manage)
   */
  autoUpdatingVersion?: SemVer
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
    get currentVersion(): never {
      throw new Error('PackageVersionInfoContext not provided')
    },
    versionCheckStatus: {lastCheckedAt: null, checking: false},
  },
)
