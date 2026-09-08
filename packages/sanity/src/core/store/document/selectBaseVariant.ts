import {type SanityDocument} from '@sanity/types'

import {type EditStateFor} from './document-pair/editState'

/**
 * Given an `EditState` object targeting the document's base variant, select
 * the base variant document.
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
