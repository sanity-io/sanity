import {groupBy, partition, uniqBy} from 'lodash-es'
import semver from 'semver'

import {STALE_TAGS_EXPIRY_SECONDS} from '../constants'
import {type VersionEntry} from '../types'
import {currentUnixTime} from '../utils'

/**
 * Cleans up version entries using TTL strategy:
 * For all major versions:
 *  - Keep all versions within TTL window
 *  - Keep highest version outside of TTL
 */
export function cleanupVersions(allVersions: VersionEntry[]): VersionEntry[] {
  const uniqueVersions = deduplicateByVersion(allVersions)

  const currentTime = currentUnixTime()
  const byMajor = groupBy(uniqueVersions, (entry) => getMajorVersion(entry.version))

  const keptVersions = Object.values(byMajor).flatMap((majorVersions) => {
    const [withinTtl, outsideTtl] = partition(
      majorVersions,
      (entry) => currentTime - entry.timestamp < STALE_TAGS_EXPIRY_SECONDS,
    )
    const highestOutsideTtl = outsideTtl.toSorted(sortByVersionDesc)[0]

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
