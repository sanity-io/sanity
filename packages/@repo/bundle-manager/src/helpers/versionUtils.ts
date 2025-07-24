import {groupBy, uniqBy} from 'lodash-es'
import semver from 'semver'

import {STALE_TAGS_EXPIRY_SECONDS} from '../constants'
import {type VersionEntry} from '../types'
import {currentUnixTime} from '../utils'

/**
 * Cleans up version entries using TTL strategy:
 * - Keep all versions within TTL window
 * - Keep highest version per major (if not already kept via TTL)
 */
export function cleanupVersions(
  existingVersions: VersionEntry[],
  newVersion: VersionEntry,
): VersionEntry[] {
  const allVersions = [newVersion, ...existingVersions]
  const uniqueVersions = deduplicateByVersion(allVersions)

  uniqueVersions.forEach((entry) => getMajorVersion(entry.version))

  if (!newVersion) {
    const byMajor = groupBy(uniqueVersions, ({version}) => getMajorVersion(version))

    return Object.values(byMajor)
      .map((majorVersions) => majorVersions.toSorted(sortBySemverDescending)[0])
      .filter(Boolean)
      .toSorted(sortByVersion)
  }

  const currentTime = currentUnixTime()
  const byMajor = groupBy(uniqueVersions, (entry) => getMajorVersion(entry.version))

  const keptVersions = Object.values(byMajor).flatMap((majorVersions) => {
    const withinTtl = majorVersions.filter(
      (entry) => currentTime - entry.timestamp < STALE_TAGS_EXPIRY_SECONDS,
    )
    const highest = majorVersions.toSorted(sortBySemverDescending)[0]

    return deduplicateByVersion([...withinTtl, highest])
  })

  return deduplicateByVersion(keptVersions).toSorted(sortByVersion)
}

/**
 * Sorts and deduplicates versions without TTL-based removal
 */
export function sortAndCleanupVersions(versions: VersionEntry[]): VersionEntry[] {
  const uniqueVersions = uniqBy(
    versions.toSorted((a, b) => b.timestamp - a.timestamp),
    'version',
  )

  return uniqueVersions.filter(Boolean).toSorted(sortByVersion)
}

const deduplicateByVersion = (versions: VersionEntry[]): VersionEntry[] =>
  uniqBy(
    versions.toSorted((a, b) => b.timestamp - a.timestamp),
    'version',
  )

const sortBySemverDescending = (a: VersionEntry, b: VersionEntry): number =>
  semver.compare(b.version, a.version)

function getMajorVersion(version: string): string {
  const parsed = semver.parse(version)

  if (!parsed) {
    throw new Error(`Invalid semver version: "${version}"`)
  }

  return parsed.major.toString()
}

function sortByVersion(
  {version: aVersion}: VersionEntry,
  {version: bVersion}: VersionEntry,
): number {
  const [aValid, bValid] = [aVersion, bVersion].map((v) => semver.valid(v))

  if (aValid && bValid) {
    return semver.compare(bVersion, aVersion) // Note: swapped to get descending order
  }

  if (aValid) return -1
  if (bValid) return 1

  return 0
}
