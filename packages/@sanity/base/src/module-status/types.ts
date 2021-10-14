import type {SanityClient} from '@sanity/client'

export interface CheckModuleVersionsOptions {
  /**
   * Sanity client to use for performing versions check
   */
  client?: SanityClient

  /**
   * Whether or not to use cached responses
   *
   * @default true
   */
  useCache?: boolean

  /**
   * Object of {moduleName: installedVersionNumber} to check status of
   *
   * @default object Automatically inferred from environment
   */
  moduleVersions?: Record<string, string>
}

export interface OutdatedPackage {
  /**
   * Outdated module name, eg `@sanity/base`
   */
  name: string

  /**
   * Installed version number
   */
  version: string

  /**
   * Latest available version number
   */
  latest: string

  /**
   * Severity of this module being out of date
   */
  severity?: 'notice' | 'low' | 'medium' | 'high'
}

export interface VersionsResponse {
  /**
   * Whether or not the current module versions are supported (still receiving maintenance/bugfixes)
   */
  isSupported: boolean

  /**
   * Whether or not the current module versions are up to date (eg "is this the latest release?")
   */
  isUpToDate: boolean

  /**
   * Array of outdated packages, if any, containing the installed and latest versions
   */
  outdated: OutdatedPackage[]

  /**
   * Optional message received from the backend
   */
  message?: string

  /**
   * Optional help URL received from the backend
   */
  helpUrl?: string
}

export interface ModuleStatusResponse extends VersionsResponse {
  /**
   * Object of {moduleName: installedVersionNumber}
   */
  installed: Record<string, string>
}
