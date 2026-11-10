import groupBy from 'lodash-es/groupBy.js'
import partition from 'lodash-es/partition.js'
import uniqBy from 'lodash-es/uniqBy.js'
import semver from 'semver'

import {STALE_TAGS_EXPIRY_SECONDS} from '../constants'
import {isDeprecated} from '../operations/deprecateVersion'
import {type DeprecatedDict, type VersionEntry} from '../types'
import {currentUnixTime} from '../utils'

interface CleanupOptions {
  /**
   * Deprecated versions are never chosen as the "highest outside TTL" fallback entry, so a
   * deprecated tag entry does not survive pruning at the expense of a good one. If every
   * outside-TTL entry for a major is deprecated, the highest one is kept as before.
   */
  deprecated?: DeprecatedDict
}

/**
 * Cleans up version entries using TTL strategy:
 * For all major versions:
 *  - Keep all versions within TTL window
 *  - Keep highest (non-deprecated) version outside of TTL
 */
export function cleanupVersions(
  allVersions: VersionEntry[],
  options: CleanupOptions = {},
): VersionEntry[] {
  const uniqueVersions = deduplicateByVersion(allVersions)

  const currentTime = currentUnixTime()
  const byMajor = groupBy(uniqueVersions, (entry) => getMajorVersion(entry.version))

  const keptVersions = Object.values(byMajor).flatMap((majorVersions) => {
    const [withinTtl, outsideTtl] = partition(
      majorVersions,
      (entry) => currentTime - entry.timestamp < STALE_TAGS_EXPIRY_SECONDS,
    )
    const sortedOutsideTtl = outsideTtl.toSorted(sortByVersionDesc)
    const highestOutsideTtl =
      sortedOutsideTtl.find((entry) => !isDeprecated(options.deprecated, entry.version)) ??
      sortedOutsideTtl[0]

    return deduplicateByVersion(highestOutsideTtl ? [...withinTtl, highestOutsideTtl] : withinTtl)
  })

  return keptVersions.toSorted(sortByVersionDesc)
}

/**
 * Sorts and deduplicates versions without TTL-based removal
 */
export function sortAndCleanupVersions(versions: VersionEntry[]): VersionEntry[] {
  const uniqueVersions = uniqBy(
    versions.toSorted((a, b) => b.timestamp - a.timestamp),
    'version',
  )

  return uniqueVersions.filter(Boolean).toSorted(sortByVersionDesc)
}

const deduplicateByVersion = (versions: VersionEntry[]): VersionEntry[] =>
  uniqBy(
    versions.toSorted((a, b) => b.timestamp - a.timestamp),
    'version',
  )

function getMajorVersion(version: string): string {
  const parsed = semver.parse(version)

  if (!parsed) {
    throw new Error(`Invalid semver version: "${version}"`)
  }

  return parsed.major.toString()
}

function sortByVersionDesc(
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
