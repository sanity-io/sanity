import {isPublishedId} from '../../util/draftUtils'

/**
 * What the version delete dialog shows, derived from the selection and the document group's
 * variants.
 *
 * @internal
 */
export interface DeletionDescription {
  /** Whether the published Default document is selected. */
  includesDefault: boolean
  /** The selected versions that the confirm action deletes. */
  deletableIds: string[]
  /** The selected versions that can't be deleted yet: the Default, while variants exist. */
  blockedIds: string[]
  /** How many distinct variants stop the Default from being deleted (0 when none do). */
  blockingVariantCount: number
}

/**
 * The published Default can't be deleted while the document has variants: they need it. The other
 * selected versions can still be deleted. Links to the Default are left to the Content Lake, which
 * decides when Delete is pressed.
 *
 * @internal
 */
export function describeDeletion({
  selectedIds,
  variantIds,
}: {
  selectedIds: string[]
  /** The distinct variants of the document group. */
  variantIds: string[]
}): DeletionDescription {
  const includesDefault = selectedIds.some(isPublishedId)
  const blockingVariantCount = includesDefault ? variantIds.length : 0
  const isDefaultBlocked = blockingVariantCount > 0

  return {
    includesDefault,
    deletableIds: isDefaultBlocked ? selectedIds.filter((id) => !isPublishedId(id)) : selectedIds,
    blockedIds: isDefaultBlocked ? selectedIds.filter(isPublishedId) : [],
    blockingVariantCount,
  }
}
