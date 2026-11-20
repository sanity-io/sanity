import {type DocumentInVariant} from '../tool/detail/types'

/**
 * A variant-scoped document version as `useVariantDocuments` returns it.
 *
 * `bundleId` is omitted for the published version, `'drafts'` for the draft, or a release id.
 *
 * @internal
 */
export function createMockDocumentInVariant({
  documentId,
  groupId,
  variantId,
  bundleId,
  documentType = 'article',
  goingToUnpublish = false,
}: {
  documentId: string
  groupId: string
  variantId: string
  bundleId?: string
  documentType?: string
  goingToUnpublish?: boolean
}): DocumentInVariant {
  const releaseRef = bundleId && bundleId !== 'drafts' ? `_.releases.${bundleId}` : null
  const updatedAt = '2025-06-01T00:00:00Z'

  return {
    memoKey: documentId,
    document: {
      _id: documentId,
      _type: documentType,
      _rev: `${documentId}-rev`,
      _createdAt: updatedAt,
      _updatedAt: updatedAt,
      publishedDocumentExists: false,
      _system: {
        ...(bundleId ? {bundleId} : {}),
        ...(releaseRef ? {release: {_ref: releaseRef, _weak: true}} : {}),
        ...(goingToUnpublish ? {delete: true} : {}),
        variants: [{_ref: variantId, _key: 'variant'}],
        group: {_ref: groupId, _weak: true},
      },
    },
    version: {
      documentId,
      bundleId,
      releaseRef,
      updatedAt,
    },
    validation: {
      hasError: false,
      isValidating: false,
      validation: [],
    },
  }
}
