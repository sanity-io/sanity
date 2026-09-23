import {type DocumentSystem} from '@sanity/types'

import {type VariantId} from '../variants/types'

/**
 * The variant document id (`_.variants.<name>`) a document belongs to, read from `_system`.
 *
 * Content Lake stores the variant a document belongs to in `_system.variants` (an array that
 * currently holds at most one reference). Documents that have not been migrated yet still carry
 * the legacy single reference in `_system.variant`, so that field is used as a fallback. Base
 * (non-variant) documents may carry `null` or an empty array in either field.
 *
 * Kept dependency-free so it can be imported from the document store's operations graph.
 *
 * @internal
 */
export function getDocumentVersionVariantId(
  document: {_system?: Partial<DocumentSystem> | null} | null | undefined,
): VariantId | undefined {
  return (
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- this system field is enforced by content lake.
    (document?._system?.variants?.[0]?._ref as VariantId) ??
    // oxlint-disable-next-line typescript/no-deprecated, typescript/no-unsafe-type-assertion -- deprecated fallback for unmigrated documents.
    (document?._system?.variant?._ref as VariantId) ??
    undefined
  )
}
