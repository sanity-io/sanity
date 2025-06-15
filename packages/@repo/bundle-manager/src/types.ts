import {type validTags} from './constants'

export type KnownEnvVar = 'GOOGLE_PROJECT_ID' | 'GCLOUD_SERVICE_KEY' | 'GCLOUD_BUCKET'

// eg 3.90.0 (without `v`-prefix)
export type Semver = string

export type DistTag = (typeof validTags)[number]

export type TagDict = {[Tag in DistTag]?: Semver | undefined}
export type PackageDict = {[PackageId in string]?: ManifestPackage}

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
