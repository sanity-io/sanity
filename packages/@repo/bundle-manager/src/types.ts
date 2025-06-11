import {type VALID_TAGS} from './constants'

export type KnownEnvVar = 'GOOGLE_PROJECT_ID' | 'GCLOUD_SERVICE_KEY' | 'GCLOUD_BUCKET'

// eg 3.90.0 (without `v`-prefix)
export type Semver = string

export type DistTag = (typeof VALID_TAGS)[number]

export type TagDict = {[Tag in DistTag]?: TagEntry[]}
export type PackageDict = {[PackageId in string]?: ManifestPackage}

export type TagEntry = {timestamp: number; version: Semver}
export type VersionEntry = {version: Semver; timestamp: number}

export interface ManifestPackage {
  default?: Semver
  versions: VersionEntry[]
  tags?: TagDict
}

export interface Manifest {
  updatedAt: string
  packages: PackageDict
}
