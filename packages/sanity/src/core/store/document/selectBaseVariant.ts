import {type SanityDocument} from '@sanity/types'

import {type EditStateFor} from './document-pair/editState'

/**
 * Given an `EditState` object checked out at the base variant's scope, select the base variant
 * document.
 *
 * The base variant is the variant belonging to the same bundle as the target document (published,
 * drafts, or a content release) that itself belongs to no variant definition. A document has at
 * most one base variant.
 *
 * `baseVariantId` is the id of the version stub resolved by `getTargetDocument`, so this function
 * only has to pick the matching document out of the pair — it never re-derives the bundle mapping,
 * which is what keeps base variant resolution in a single place.
 *
 * Returns `null` when:
 *
 * - There is no base variant to compare against (`baseVariantId` is `undefined`).
 * - The pair has not loaded the document yet. A stub can resolve before its pair does, so the
 *   absence of a document here is transient rather than a statement that no base variant exists.
 * - The document turns out to belong to a variant definition after all. The base variant is defined
 *   by the *absence* of `_system.variant`; asserting that here means the definition is enforced
 *   rather than inferred from the shape of a document id.
 *
 * @internal
 */
export function selectBaseVariant(
  baseVariantEditState: EditStateFor,
  baseVariantId: string | undefined,
): SanityDocument | null {
  if (!baseVariantId) {
    return null
  }

  const baseVariant = [
    baseVariantEditState.version,
    baseVariantEditState.draft,
    baseVariantEditState.published,
  ].find((document) => document?._id === baseVariantId)

  if (!baseVariant || baseVariant._system?.variant) {
    return null
  }

  return baseVariant
}
