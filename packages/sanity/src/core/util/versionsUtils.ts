import {type VersionInfoDocumentStub} from '../releases/store/types'

/**
 * Uses the _system field to check if a version is a published version
 * @beta
 */
export function isPublishedVersion(
  version: Pick<VersionInfoDocumentStub, '_id' | '_system'>,
): boolean {
  return (
    version._system.group._ref === version._id &&
    !version._system.variant &&
    !version._system.release &&
    !version._system.bundleId
  )
}

/**
 * Uses the _system field to check if a version is a draft version
 * @beta
 */
export function isDraftVersion(version: Pick<VersionInfoDocumentStub, '_id' | '_system'>): boolean {
  return (
    !version._system?.variant && !version._system?.release && version._system?.bundleId === 'drafts'
  )
}

/**
 * Uses the _system field to check if a version is a variant version
 * @beta
 */
export function isVariantVersion(
  version: Pick<VersionInfoDocumentStub, '_id' | '_system'>,
): boolean {
  return Boolean(version._system?.variant)
}

/**
 * Uses the _system field to check if a version is a release version
 * @beta
 */
export function isReleaseVersion(
  version: Pick<VersionInfoDocumentStub, '_id' | '_system'>,
): boolean {
  return Boolean(version._system?.release)
}
