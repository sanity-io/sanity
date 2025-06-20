import {uniqBy} from 'lodash-es'
import semver from 'semver'

import {isValidTag} from '../assert'
import {STALE_TAGS_EXPIRY_SECONDS, VALID_TAGS} from '../constants'
import {type DistTag, type ManifestPackage, type Semver, type TagEntry} from '../types'
import {currentUnixTime} from '../utils'

interface TagVersionOptions {
  setAsDefault?: boolean
}
export function tagVersion(
  manifestPackage: ManifestPackage,
  tag: DistTag,
  tagEntry: {timestamp: number; version: Semver},
  options: TagVersionOptions = {},
): ManifestPackage {
  const targetVersionExists = manifestPackage.versions.some(
    (entry) => entry.version === tagEntry.version,
  )
  if (!targetVersionExists) {
    throw new Error(`Version "${tagEntry.version}" not known`)
  }
  if (!isValidTag(tag)) {
    throw new Error(`Invalid tag "${tag}". Must be one of: ${VALID_TAGS.join(', ')}"`)
  }

  const existingTags = manifestPackage?.tags?.[tag] || []

  if (!Array.isArray(existingTags)) {
    throw new Error('Expected tags to be an array')
  }

  const existingEntry = existingTags.find((entry) => entry.version === tagEntry.version)

  const updatedPackage = existingEntry
    ? manifestPackage
    : // entry doesn't exist in list of tags, add it
      {
        ...manifestPackage,
        tags: {
          ...manifestPackage.tags,
          [tag]: sortAndRemoveOldEntries([tagEntry, ...existingTags]),
        },
      }

  return options.setAsDefault ? setDefault(updatedPackage, tagEntry.version) : updatedPackage
}

function sortAndRemoveOldEntries(versions: TagEntry[]): TagEntry[] {
  return (
    uniqBy(
      versions
        // NOTE: important that we sort by timestamp since unique-ing will keep the first entry.
        // We want to keep the version with the most recent timestamp, and we don't want duplicates
        .toSorted((a, b) => b.timestamp - a.timestamp),
      'version',
    )
      // in the end, we want the list to be sorted by most recent version first
      .toSorted((a, b) => semver.compare(b.version, a.version))
      .filter((entry) => currentUnixTime() - entry.timestamp < STALE_TAGS_EXPIRY_SECONDS)
  )
}

function setDefault(manifestPackage: ManifestPackage, version: Semver): ManifestPackage {
  return {...manifestPackage, default: version}
}
