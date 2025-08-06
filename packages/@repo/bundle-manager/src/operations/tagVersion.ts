import {isValidTag} from '../assert'
import {VALID_TAGS} from '../constants'
import {cleanupVersions} from '../helpers/versionUtils'
import {type DistTag, type ManifestPackage, type Semver} from '../types'

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
          [tag]: cleanupVersions([tagEntry, ...existingTags]),
        },
      }

  return options.setAsDefault ? setDefault(updatedPackage, tagEntry.version) : updatedPackage
}

function setDefault(manifestPackage: ManifestPackage, version: Semver): ManifestPackage {
  return {...manifestPackage, default: version}
}
