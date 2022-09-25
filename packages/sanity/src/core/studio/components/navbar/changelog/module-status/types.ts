import type {SanityClient} from '@sanity/client'
import type {SanityImageHotspot, SanityImageCrop, SanityImageDimensions} from '@sanity/asset-utils'
import type {PortableTextBlock} from '@portabletext/types'

export interface CodeBlock {
  _type: 'code'
  code?: string
  language?: string
  filename?: string
  highlightedLines?: number[]
}

export interface MaterializedImage {
  _type: 'image'
  alt?: string
  caption?: string
  hotspot?: SanityImageHotspot
  crop?: SanityImageCrop
  asset: {
    _id: string
    path: string
    metadata: {
      dimensions: SanityImageDimensions
      lqip?: string
    }
  }
}

export type StudioBlockContent = PortableTextBlock | CodeBlock | MaterializedImage

export interface ChangelogItem {
  changeType: 'bugfix' | 'feature'
  description: StudioBlockContent[]
  title?: string
}

export interface ChangelogVersion {
  changeItems: ChangelogItem[] | null
  version: string
  isLatest: boolean
}

export type Changelog = ChangelogVersion[]

export interface CheckModuleVersionsOptions {
  /**
   * Sanity client to use for performing versions check
   */
  client: SanityClient

  /**
   * Whether or not to use cached responses
   *
   * @defaultValue true
   */
  useCache?: boolean

  /**
   * Object of `{moduleName: installedVersionNumber}` to check status of
   *
   * @defaultValue object Automatically inferred from environment
   */
  moduleVersions?: Record<string, string>
}

export interface OutdatedPackage {
  /**
   * Outdated module name, eg `@sanity/vision`
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

  /**
   * Studio changelog
   */
  changelog?: Changelog

  /**
   * The current version of the studio
   */
  currentVersion?: string

  /**
   * The latest available version of the studio
   */
  latestVersion?: string
}

export interface ModuleStatusResponse extends VersionsResponse {
  /**
   * Object of `{moduleName: installedVersionNumber}`
   */
  installed: Record<string, string>
}
