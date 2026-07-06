import {useMemo} from 'react'

import {
  type DocumentInRelease,
  useBundleDocuments,
} from '../../releases/tool/detail/useBundleDocuments'
import {getVariantId} from '../tool/util'

/**
 * Hook to fetch the documents that belong to a variant.
 *
 * Reuses the generic {@link useBundleDocuments} machinery with
 * `sanity::partOfVariant($variantId)`.
 *
 * @internal
 */
export function useVariantDocuments(variantDocumentId: string): {
  loading: boolean
  results: DocumentInRelease[]
  error: null | Error
} {
  const variantId = getVariantId(variantDocumentId)
  const params = useMemo(() => ({variantId}), [variantId])

  return useBundleDocuments({
    groqFilter: `sanity::partOfVariant($variantId)`,
    params,
    cacheKey: `variant-${variantId}`,
  })
}
