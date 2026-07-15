import {type SanityDocument} from '@sanity/types'

import {getVariantId} from '../tool/util'

/**
 * The routing information of a variant-scoped version document, derived from its `_system`.
 *
 */
export interface VariantVersionInfo {
  /** The short variant name (the `_.variants.` prefix stripped from `_system.variant._ref`). */
  variantId: string
  /**
   * The bundle the variant document belongs to: `'drafts'`, a release id, or `'published'` for
   * the variant-of-published document (which carries no `_system.bundleId`).
   */
  bundleId: 'drafts' | 'published' | (string & {})
}

/**
 * Derives variant routing information from a version document snapshot's `_system`, or
 * `undefined` when the document is not variant-scoped.
 *
 * This is the single discriminator the document operations use to decide between the base and
 * variant action paths. The `_system` field is authoritative and always present on variant
 * documents — only pre-migration non-variant documents may lack it, and those can never be
 * variant-scoped.
 *
 */
export function getVariantVersionInfo(
  version: SanityDocument | null | undefined,
): VariantVersionInfo | undefined {
  const variantRef = version?._system?.variant?._ref
  if (!variantRef) {
    return undefined
  }

  return {
    // Strip the `_.variants.` document path prefix to the short variant id. Kept local (instead
    // of `getVariantId` from `variants/tool/util`) to avoid pulling tool-level modules — and
    // their import cycles — into the document store's operations graph.
    variantId: getVariantId(variantRef),
    bundleId: version._system?.bundleId ?? 'published',
  }
}
