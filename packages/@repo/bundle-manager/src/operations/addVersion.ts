import {uniqBy} from 'lodash-es'
import semver from 'semver'

import {type ManifestPackage, type VersionEntry} from '../types'

export function addVersion(
  manifestPackage: ManifestPackage,
  versionEntry: VersionEntry,
): ManifestPackage {
  return {
    ...manifestPackage,
    versions: sortAndCleanup([versionEntry, ...(manifestPackage.versions || [])]),
  }
}

function sortAndCleanup(versions: VersionEntry[]): VersionEntry[] {
  return (
    uniqBy(
      versions
        // NOTE: important that we sort by timestamp since unique-ing will keep the first entry.
        // We want to keep the version with the most recent timestamp, and we don't want duplicates
        .toSorted((a, b) => b.timestamp - a.timestamp),
      'version',
    )
      // in the end, we want the list to be sorted by oldest versions first
      .toSorted((a, b) => semver.compare(b.version, a.version))
  )
}
