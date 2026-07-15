import {type VersionInfoDocumentStub} from '../releases/store/types'
import {isAgentBundleName} from '../store/agent/createAgentBundlesStore'
import {getVariantId} from '../variants/tool/util'
import {getDraftId, getVersionFromId} from './draftUtils'

type VariantConstraint =
  | {
      /**
       * Match only the provided variant id.
       *
       * This value **must** be the bare variant id ("x", rather than "_.variants.x").
       */
      variant: string
      baseVariant?: never
      anyVariant?: never
    }
  | {
      variant?: never
      /**
       * Match only the base variant.
       */
      baseVariant: true
      anyVariant?: never
    }
  | {
      variant?: never
      baseVariant?: never
      /**
       * Match any variant.
       */
      anyVariant: true
    }

/** @beta */
export type VersionType = 'draft' | 'published' | 'release' | 'agent'

/**
 * Uses the `_system` field to check if a version is a published version.
 *
 * By default, any published variant will match. Use the constraint options to
 * limit matching to the base variant, or to a particular variant id.
 *
 * @beta
 */
export function isPublishedVersion(
  version: VersionInfoDocumentStub,
  options: {constraint: VariantConstraint} = {constraint: {anyVariant: true}},
): boolean {
  const {constraint} = options
  const isPublished = !isReleaseVersion(version) && typeof version._system.bundleId === 'undefined'

  if (!isPublished) {
    return false
  }

  if ('variant' in constraint) {
    return (
      isVariantVersion(version) &&
      getVariantId(version._system.variant?._ref ?? '') === constraint.variant
    )
  }

  if (constraint.baseVariant) {
    return !isVariantVersion(version) && version._system.group._ref === version._id
  }

  if (constraint.anyVariant) {
    return true
  }

  return false
}

/**
 * Uses the `_system` field to check if a version is a draft version.
 *
 * By default, any draft variant will match. Use the constraint options to
 * limit matching to the base variant, or to a particular variant id.
 *
 * @beta
 */
export function isDraftVersion(
  version: VersionInfoDocumentStub,
  options: {constraint: VariantConstraint} = {constraint: {anyVariant: true}},
): boolean {
  const {constraint} = options
  const isDraft = version._system?.bundleId === 'drafts'

  if (!isDraft) {
    return false
  }

  if ('variant' in constraint) {
    return (
      isVariantVersion(version) &&
      getVariantId(version._system.variant?._ref ?? '') === constraint.variant
    )
  }

  if (constraint.baseVariant) {
    return !isVariantVersion(version) && version._id === getDraftId(version._system.group._ref)
  }

  if (constraint.anyVariant) {
    return true
  }

  return false
}

/**
 * Uses the _system field to check if a version is a variant version
 * @beta
 */
export function isVariantVersion(version: VersionInfoDocumentStub): boolean {
  return Boolean(version._system?.variant)
}

/**
 * Uses the _system field to check if a version is a release version
 * @beta
 */
export function isReleaseVersion(version: VersionInfoDocumentStub): boolean {
  return Boolean(version._system?.release)
}

/**
 * Uses the _system field to determine the version type of a document.
 * @beta
 */
export function readVersionType(
  version: VersionInfoDocumentStub | undefined,
): VersionType | undefined {
  if (typeof version === 'undefined') {
    return undefined
  }

  if (isAgentBundleName(getVersionFromId(version._id))) {
    return 'agent'
  }

  if (isPublishedVersion(version)) {
    return 'published'
  }

  if (isReleaseVersion(version)) {
    return 'release'
  }

  if (isDraftVersion(version)) {
    return 'draft'
  }
}
