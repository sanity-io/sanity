import {type validTags} from './constants'

export type KnownEnvVar = 'GOOGLE_PROJECT_ID' | 'GCLOUD_SERVICE_KEY' | 'GCLOUD_BUCKET'

// eg 3.90.0 (without `v`-prefix)
export type Semver = string
export type MajorVersion = number

export type DistTag = (typeof validTags)[number]

export type TagDict = Record<DistTag, VersionEntry[]>

type VersionEntry = {version: Semver; timestamp: number}

export interface ManifestPackage {
  default: Semver
  tags: TagDict
  versions: VersionEntry[]
}

export interface Manifest {
  updatedAt: string
  packages: Record<string, ManifestPackage>
}
