import {type ManifestPackage, type VersionEntry} from '../types'
import {cleanupVersions} from '../utils/versionUtils'

export function addVersion(
  manifestPackage: ManifestPackage,
  versionEntry: VersionEntry,
): ManifestPackage {
  return {
    ...manifestPackage,
    versions: cleanupVersions([versionEntry, ...(manifestPackage.versions || [])], versionEntry),
  }
}
