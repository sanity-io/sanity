import {isPublishedId} from '../../util/draftUtils'
import {
  type CrossDatasetReferences,
  type IncomingReference,
  type InternalReferences,
} from '../machines/deletionMachine'

/**
 * How much the dialog knows about the strength of the links to the Default document:
 *
 * - `known`: every listed link was read, and the list holds every link.
 * - `partial`: more documents link here than the reference query lists, and none of the listed
 *   links is required. A required link may sit in the part that was not read, so the dialog names
 *   no strength and lets the Content Lake decide.
 * - `unknown`: the strength read failed. The dialog falls back to main's warning.
 */
export type LinkStrengthKnowledge = 'known' | 'partial' | 'unknown'

/**
 * Everything the version delete dialog shows, derived from the selection, the document group's
 * variants and the links to the Default document.
 *
 * @internal
 */
export interface DeletionDescription {
  /** Whether the published Default document is selected. */
  includesDefault: boolean
  /** The selected versions that the confirm action deletes. */
  deletableIds: string[]
  /** The selected versions that can't be deleted yet: the Default, when it is blocked. */
  blockedIds: string[]
  /** How many distinct variants stop the Default from being deleted (0 when none do). */
  blockingVariantCount: number
  /** How many listed documents link to the Default with a required link (0 when none block). */
  requiredLinkCount: number
  /** How many listed release copies link to the Default with a required link. */
  failsLaterCount: number
  /** How many documents link to the Default with an optional link, cross-dataset links included. */
  optionalLinkCount: number
  /** Every document that links to the Default, internal and cross-dataset. */
  totalLinkCount: number
  strength: LinkStrengthKnowledge
}

/**
 * @internal
 */
export function describeDeletion({
  selectedIds,
  variantIds,
  internalReferences,
  crossDatasetReferences,
}: {
  selectedIds: string[]
  /** The distinct variants of the document group. */
  variantIds: string[]
  internalReferences: InternalReferences
  crossDatasetReferences: CrossDatasetReferences
}): DeletionDescription {
  const includesDefault = selectedIds.some(isPublishedId)
  const references = internalReferences.references

  const strength = getStrengthKnowledge(internalReferences)
  const requiredLinkCount = includesDefault ? references.filter(isRequired).length : 0
  const failsLaterCount = references.filter((reference) => reference.failsLater === true).length
  const optionalLinkCount =
    references.filter((reference) => !isRequired(reference) && reference.failsLater !== true)
      .length + crossDatasetReferences.totalCount

  const blockingVariantCount = includesDefault ? variantIds.length : 0
  const isDefaultBlocked = blockingVariantCount > 0 || requiredLinkCount > 0

  return {
    includesDefault,
    deletableIds: isDefaultBlocked ? selectedIds.filter((id) => !isPublishedId(id)) : selectedIds,
    blockedIds: isDefaultBlocked ? selectedIds.filter(isPublishedId) : [],
    blockingVariantCount,
    requiredLinkCount,
    failsLaterCount,
    optionalLinkCount,
    totalLinkCount: internalReferences.totalCount + crossDatasetReferences.totalCount,
    strength,
  }
}

function isRequired(reference: IncomingReference): boolean {
  return reference.required === true
}

function getStrengthKnowledge(internalReferences: InternalReferences): LinkStrengthKnowledge {
  const {references, totalCount} = internalReferences
  if (!references.every((reference) => typeof reference.required === 'boolean')) {
    return 'unknown'
  }
  if (totalCount > references.length && !references.some(isRequired)) {
    return 'partial'
  }
  return 'known'
}
