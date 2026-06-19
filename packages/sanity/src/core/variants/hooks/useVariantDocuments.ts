import {useMemo} from 'react'

import {
  type DocumentInRelease,
  useBundleDocuments,
} from '../../releases/tool/detail/useBundleDocuments'

/**
 * Hook to fetch the documents that belong to a variant.
 *
 * Reuses the generic {@link useBundleDocuments} machinery with the `sanity::partOfVariant`
 * GROQ filter.
 *
 * Note: `sanity::partOfVariant` is not yet supported in content lake, so this hook will
 * return no documents until that support lands.
 *
 * @internal
 */
export function useVariantDocuments(variantId: string): {
  loading: boolean
  results: DocumentInRelease[]
  error: null | Error
} {
  const params = useMemo(() => ({variantId}), [variantId])

  return useBundleDocuments({
    // TODO: Switch to `sanity::partOfVariant` when content lake supports it.
    // groqFilter: `sanity::partOfVariant($variantId)`,
    groqFilter: `_system.variant._ref == $variantId`,
    params,
    cacheKey: `variant-${variantId}`,
  })
}
