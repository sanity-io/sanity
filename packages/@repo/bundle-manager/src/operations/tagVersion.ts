import {isValidTag} from '../assert'
import {type DistTag, type ManifestPackage, type Semver} from '../types'

export function tagVersion(
  manifestPackage: ManifestPackage,
  tag: DistTag,
  targetVersion: Semver,
): ManifestPackage {
  const targetVersionExists = manifestPackage.versions.some(
    (entry) => entry.version === targetVersion,
  )
  if (!targetVersionExists) {
    throw new Error(`Version "${targetVersion}" not known`)
  }
  if (!isValidTag(tag)) {
    throw new Error(`Invalid tag "${tag}"`)
  }
  return {
    ...manifestPackage,
    tags: {
      ...manifestPackage.tags,
      [tag]: targetVersion,
    },
  }
}
