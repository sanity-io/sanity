import {type ManifestPackage, type VersionEntry} from '../types'
import {sortAndCleanupVersions} from '../utils/versionUtils'

export function addVersion(
  manifestPackage: ManifestPackage,
  versionEntry: VersionEntry,
): ManifestPackage {
  return {
    ...manifestPackage,
    versions: sortAndCleanupVersions([versionEntry, ...(manifestPackage.versions || [])]),
  }
}
