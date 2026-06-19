import {useMemo} from 'react'

import {
  type DocumentInRelease,
  useBundleDocuments,
} from '../../releases/tool/detail/useBundleDocuments'
import {type DocumentInVariant} from '../tool/detail/types'
import {toVariantDocumentVersion} from '../tool/detail/variantDocumentVersion'

/**
 * Hook to fetch the documents that belong to a variant.
 *
 * Reuses the generic {@link useBundleDocuments} machinery. Currently filters by
 * `_system.variant._ref` until `sanity::partOfVariant($variantId)` is supported
 * in content lake.
 *
 * @internal
 */
export function useVariantDocuments(variantId: string | undefined): {
  loading: boolean
  results: DocumentInVariant[]
  error: null | Error
} {
  const enabled = Boolean(variantId)
  const params = useMemo(() => ({variantId: variantId ?? ''}), [variantId])

  const {loading, results, error} = useBundleDocuments({
    groqFilter: `sanity::partOfVariant($variantId)`,
    params,
    cacheKey: enabled ? `variant-${variantId}` : 'variant-disabled',
    enabled,
  })

  const variantResults = useMemo(
    () => (enabled ? toDocumentInVariants(results) : []),
    [enabled, results],
  )

  return {
    loading: enabled && loading,
    results: variantResults,
    error: enabled ? error : null,
  }
}

function toDocumentInVariants(results: DocumentInRelease[]): DocumentInVariant[] {
  return results.flatMap((result) => {
    const version = toVariantDocumentVersion(result.document)

    return version ? [{...result, version}] : []
  })
}
