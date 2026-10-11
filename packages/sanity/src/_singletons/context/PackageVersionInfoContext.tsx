import {createContext} from 'sanity/_createContext'
import type {SemVer} from 'semver'

/**
 * @hidden
 * @internal
 */
export interface PackageVersionDeprecation {
  /** The deprecated version: the running version, or the pinned version a reload would apply */
  version: SemVer
  /** Human readable explanation set when the version was deprecated, if any */
  reason?: string
  /** True when this Studio is auto-updating and pinned to the deprecated version */
  isPinned: boolean
}

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
   * What is the current auto-updating version (as periodically resolved via module server and configured via manage).
   * This is the version the module CDN will serve for the studio's import map URL, so a reload
   * applies exactly this version — it may also be below the current version (e.g. a pinned rollback).
   */
  autoUpdatingVersion?: SemVer

  /**
   * Set when the user should be warned about a deprecated version: this Studio either is not
   * auto-updating and runs a deprecated version, or is auto-updating but pinned (via manage) to a
   * deprecated version so a reload would still land on it. Not set when a reload fixes it, since
   * the regular "new version available" state already covers that.
   */
  versionDeprecation?: PackageVersionDeprecation
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
