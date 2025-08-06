import {sortAndCleanupVersions} from '../helpers/versionUtils'
import {type ManifestPackage, type VersionEntry} from '../types'

export function addVersion(
  manifestPackage: ManifestPackage,
  versionEntry: VersionEntry,
): ManifestPackage {
  return {
    ...manifestPackage,
    versions: sortAndCleanupVersions([versionEntry, ...(manifestPackage.versions || [])]),
  }
}
