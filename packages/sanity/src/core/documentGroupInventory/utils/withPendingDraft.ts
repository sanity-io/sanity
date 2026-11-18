import {getDocumentVersionVariantId} from '../../util/getDocumentVersionVariant'
import {type VariantSet} from '../machines/documentGroupInventoryMachine'

/**
 * A draft the form is about to create: in Drafts, the open audience (Default or a variant) has no
 * draft yet, so the form shows its published version and the first edit creates the draft at this
 * id. The inventory shows it as a ghost row, marked open, where the draft will land.
 *
 * @internal
 */
export interface PendingDraft {
  /** The id the draft will take once it exists. */
  id: string
  /** The variant the draft belongs to; absent for Default. */
  variantId?: string
  /** The row's title: the variant's name, or Default. */
  name: string
}

/**
 * A set as the inventory draws it: its versions, and where a pending draft's ghost row goes.
 *
 * @internal
 */
export interface DisplayedVariantSet extends VariantSet {
  /** The ghost row and the index among `variants` it is drawn before. */
  pending?: {draft: PendingDraft; index: number}
}

/**
 * Places a pending draft's ghost row in the Draft set, where the draft will land once it exists:
 * Default before the variants, and variants in the inventory's variant order. When the document has
 * no drafts at all, a Draft set with only the ghost row goes after Published. The sets of a studio
 * with Content Variants off (one set, no bundle) and a draft that already exists are left as they
 * are.
 *
 * @internal
 */
export function withPendingDraft(
  sets: VariantSet[],
  pending: PendingDraft | undefined,
  draftSetName: string,
): DisplayedVariantSet[] {
  if (!pending || sets.length === 0 || sets.some(({bundle}) => !bundle)) {
    return sets
  }
  if (sets.some(({variants}) => variants.some(({id}) => id === pending.id))) {
    return sets
  }

  const draftsIndex = sets.findIndex(({key}) => key === 'drafts')
  if (draftsIndex !== -1) {
    const drafts = sets[draftsIndex]
    return (sets as DisplayedVariantSet[]).toSpliced(draftsIndex, 1, {
      ...drafts,
      pending: {draft: pending, index: pendingIndex(drafts, pending)},
    })
  }

  // No drafts yet: the Draft set goes where it would be, after Published (and after Proposed
  // changes when that set comes first), before the releases.
  const publishedIndex = sets.findIndex(({key}) => key === 'published')
  const agentIndex = sets.findIndex(({key}) => key === 'studio:content-agent')
  const insertAt = publishedIndex !== -1 ? publishedIndex + 1 : agentIndex === 0 ? 1 : 0
  return (sets as DisplayedVariantSet[]).toSpliced(insertAt, 0, {
    key: 'drafts',
    name: draftSetName,
    bundle: {type: 'perspective', perspective: 'drafts'},
    variants: [],
    pending: {draft: pending, index: 0},
  })
}

/** The inventory's order within a set: Default first, then variants by id. */
function pendingIndex(set: VariantSet, pending: PendingDraft): number {
  const index = set.variants.findIndex(({document}) => {
    const variantId = getDocumentVersionVariantId(document)
    if (!pending.variantId) return true
    return variantId !== undefined && variantId.localeCompare(pending.variantId) > 0
  })
  return index === -1 ? set.variants.length : index
}
