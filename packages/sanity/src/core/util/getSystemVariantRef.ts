import {type DocumentSystem, type DocumentSystemRef} from '@sanity/types'

/**
 * The variant reference of a document's `_system`.
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
export function getSystemVariantRef(
  system: Partial<DocumentSystem> | null | undefined,
): DocumentSystemRef | undefined {
  return system?.variants?.[0] ?? system?.variant ?? undefined
}

/**
 * The variant document id (`_.variants.<name>`) a document belongs to, read from `_system` via
 * {@link getSystemVariantRef}, or `undefined` for base (non-variant) documents.
 *
 * @internal
 */
export function getSystemVariantId(
  system: Partial<DocumentSystem> | null | undefined,
): string | undefined {
  return getSystemVariantRef(system)?._ref || undefined
}
