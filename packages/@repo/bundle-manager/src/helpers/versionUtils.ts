import {groupBy, uniqBy} from 'lodash-es'
import semver from 'semver'

import {STALE_TAGS_EXPIRY_SECONDS} from '../constants'
import {type VersionEntry} from '../types'
import {currentUnixTime} from '../utils'

/**
 * Cleans up and sorts version entries with mixed strategy:
 * - For the new version's major: TTL cleanup (keep multiple versions within grace period)
 * - For other majors: Keep only highest semver version
 * @param versions - Array of version entries to clean up
 * @param newVersion - The version being added (determines which major gets TTL treatment)
 * @returns Cleaned and sorted array of version entries
 */
export function cleanupVersions(
  versions: VersionEntry[],
  newVersion?: VersionEntry,
): VersionEntry[] {
  const uniqueVersions = deduplicateByVersion(versions)

  if (!newVersion) {
    // Fallback to keeping highest semver per major if no new version specified
    const byMajor = groupBy(uniqueVersions, ({version}) => getMajorVersion(version))

    return Object.values(byMajor)
      .map((majorVersions) => majorVersions.toSorted(sortBySemverDescending)[0])
      .filter(Boolean)
      .toSorted(sortByVersion)
  }

  const newVersionMajor = getMajorVersion(newVersion.version)
  const byMajor = groupBy(uniqueVersions, (entry) => getMajorVersion(entry.version))

  const keptVersions = Object.entries(byMajor).flatMap(([major, majorVersions]) =>
    processMajorVersionGroup(major, majorVersions, newVersionMajor, newVersion),
  )

  return keptVersions.toSorted(sortByVersion)
}

/**
 * Sorts and deduplicates versions without TTL-based removal
 * @param versions - Array of version entries to clean up
 * @returns Sorted and deduplicated array of version entries
 */
export function sortAndCleanupVersions(versions: VersionEntry[]): VersionEntry[] {
  // First deduplicate versions, keeping most recent timestamp
  const uniqueVersions = uniqBy(
    versions.toSorted((a, b) => b.timestamp - a.timestamp),
    'version',
  )

  // Sort final list by semver, descending
  return uniqueVersions.filter(Boolean).toSorted(sortByVersion)
}

const processMajorVersionGroup = (
  major: string,
  majorVersions: VersionEntry[],
  newVersionMajor: string,
  newVersion: VersionEntry,
): VersionEntry[] =>
  major === newVersionMajor
    ? applyTtlCleanup(majorVersions, newVersion)
    : getHighestSemverVersion(majorVersions)

function applyTtlCleanup(majorVersions: VersionEntry[], newVersion: VersionEntry): VersionEntry[] {
  const withinTtl = majorVersions.filter(
    (entry) => currentUnixTime() - entry.timestamp < STALE_TAGS_EXPIRY_SECONDS,
  )
  const newVersionEntry = withinTtl.some((v) => v.version === newVersion.version)
    ? []
    : [newVersion]

  return [...withinTtl, ...newVersionEntry]
}

function getHighestSemverVersion(majorVersions: VersionEntry[]): VersionEntry[] {
  const highest = majorVersions.toSorted(sortBySemverDescending)

  return highest.length === 1 ? highest : []
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

  return parsed ? parsed.major.toString() : '0'
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
