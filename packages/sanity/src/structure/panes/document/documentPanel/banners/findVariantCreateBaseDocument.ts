import {type SanityDocumentLike} from '@sanity/types'
import {getTargetDocument, type SystemVariant, type VersionInfoDocumentStub} from 'sanity'

export type VariantCreateBaseDocument = {
  _id: string
  _rev: string | undefined
}

/**
 * Resolves which existing document to copy when creating a variant-scoped version.
 *
 * Matches version stubs whose `_system.variant._ref` equals the selected variant id.
 *
 * 1. Drafts variant sibling, then published variant sibling.
 * 2. The provided fallback (typically the document currently shown in the pane).
 *
 * @internal
 */
export function findVariantCreateBaseDocument({
  variant,
  documentVersions,
  fallback,
}: {
  /** Variant definition being created. */
  variant: SystemVariant
  /** All version stubs for the document group from `useDocumentVersions`. */
  documentVersions: VersionInfoDocumentStub[]
  /** Last-resort base document, usually the pane's current `value`. */
  fallback: Pick<SanityDocumentLike, '_id'> & {_rev?: string}
}): VariantCreateBaseDocument {
  const preferredVariantDocument =
    getTargetDocument({bundle: 'drafts', variant: variant._id, documentVersions}) ||
    getTargetDocument({bundle: 'published', variant: variant._id, documentVersions})

  if (preferredVariantDocument) {
    return {_id: preferredVariantDocument._id, _rev: preferredVariantDocument._rev}
  }

  return {_id: fallback._id, _rev: fallback._rev}
}
