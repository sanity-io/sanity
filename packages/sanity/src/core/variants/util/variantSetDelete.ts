import {type EditableSystemVariant, type SystemVariant, type VariantId} from '../types'
import {detachVariantFromSet, getVariantSetReference, type VariantSetReference} from './variantSet'

/**
 * The plan for deleting a variant set, computed from its current members and their document counts.
 *
 * Members with no documents are deleted outright. Members that carry documents are *not* deleted
 * (that would orphan content) — instead they are detached from the set, surviving as standalone
 * definitions so the set itself disappears from the overview.
 *
 * @internal
 */
export interface VariantSetDeletionPlan {
  /** Member definitions with no documents — safe to delete. */
  deleteIds: VariantId[]
  /** Member definitions with documents, rewritten to drop set membership (kept as standalone). */
  detaches: EditableSystemVariant[]
  /** Number of members kept (== detaches.length), surfaced for confirmation messaging. */
  retainedCount: number
}

/**
 * Plans the deletion of a variant set.
 *
 * @internal
 */
export function planVariantSetDeletion({
  setReference,
  children,
  documentCountById,
}: {
  setReference: VariantSetReference
  children: SystemVariant[]
  documentCountById: Record<string, number | undefined>
}): VariantSetDeletionPlan {
  const members = children.filter(
    (variant) => getVariantSetReference(variant)?.id === setReference.id,
  )

  const deleteIds: VariantId[] = []
  const detaches: EditableSystemVariant[] = []

  for (const member of members) {
    const documentCount = documentCountById[member._id] ?? 0
    if (documentCount > 0) {
      detaches.push(detachVariantFromSet(member))
    } else {
      deleteIds.push(member._id)
    }
  }

  return {deleteIds, detaches, retainedCount: detaches.length}
}
