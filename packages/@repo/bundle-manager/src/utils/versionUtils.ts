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
  // First deduplicate versions, keeping most recent timestamp
  const uniqueVersions = uniqBy(
    versions.toSorted((a, b) => b.timestamp - a.timestamp),
    'version',
  )

  if (!newVersion) {
    // Fallback to keeping highest semver per major if no new version specified
    return cleanupByHighestSemver(uniqueVersions)
  }

  const newVersionMajor = getMajorVersion(newVersion.version)

  // Group versions by major version number
  const byMajor = groupBy(uniqueVersions, (entry) => getMajorVersion(entry.version))

  const keptVersions: VersionEntry[] = []

  for (const [major, majorVersions] of Object.entries(byMajor)) {
    if (major === newVersionMajor) {
      // For the new version's major: apply TTL cleanup
      const withinTtl = majorVersions.filter(
        (entry) => currentUnixTime() - entry.timestamp < STALE_TAGS_EXPIRY_SECONDS,
      )
      // Always include the new version even if outside TTL
      const versionsToKeep = [
        ...withinTtl,
        ...(withinTtl.some((v) => v.version === newVersion.version) ? [] : [newVersion]),
      ]
      keptVersions.push(...versionsToKeep)
    } else {
      // For other majors: keep only highest semver version
      const highest = majorVersions.toSorted((a, b) => semver.compare(b.version, a.version))[0]
      if (highest) {
        keptVersions.push(highest)
      }
    }
  }

  // Sort final list by semver, descending
  return keptVersions.filter(Boolean).toSorted(sortByVersion)
}

/**
 * Simpler cleanup that just sorts and deduplicates versions without TTL-based removal
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

/**
 * Fallback cleanup that keeps only highest semver per major
 */
function cleanupByHighestSemver(versions: VersionEntry[]): VersionEntry[] {
  const byMajor = groupBy(versions, (entry) => getMajorVersion(entry.version))

  const keptVersions = Object.values(byMajor).map(
    (majorVersions) => majorVersions.toSorted((a, b) => semver.compare(b.version, a.version))[0],
  )

  return keptVersions.filter(Boolean).toSorted(sortByVersion)
}

/**
 * Get major version number from a semver string
 */
function getMajorVersion(version: string): string {
  const parsed = semver.parse(version)
  return parsed ? parsed.major.toString() : '0'
}

/**
 * Safe version comparison that handles invalid semver versions
 */
function sortByVersion(
  {version: aVersion}: VersionEntry,
  {version: bVersion}: VersionEntry,
): number {
  const aValid = semver.valid(aVersion)
  const bValid = semver.valid(bVersion)

  // If both are valid semver, compare them
  if (aValid && bValid) {
    return semver.compare(bVersion, aVersion) // Note: swapped to get descending order
  }

  // Invalid versions sort after valid ones
  if (aValid) return -1
  if (bValid) return 1

  // If both are invalid, sort by timestamp (newer first)
  return 0
}
