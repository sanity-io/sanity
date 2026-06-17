import {type SanityDocument} from '@sanity/types'
import {uuid} from '@sanity/uuid'
import {useMemo} from 'react'

import {
  type DocumentValidationStatus,
  resetBundleDocumentsCacheForTests,
  useBundleDocuments,
} from '../../../releases/tool/detail/useBundleDocuments'
import {VARIANTS_STUDIO_CLIENT_OPTIONS} from '../../store/constants'

/**
 * A single document that belongs to a variant.
 *
 * @internal
 */
export interface DocumentInVariant {
  memoKey: string
  document: SanityDocument
  validation: DocumentValidationStatus
}

// TODO: replace with sanity::partOfVariant($variantId) when the native GROQ function ships
const VARIANT_DOCUMENTS_GROQ_FILTER = '_system.variant._ref == $variantId'

const mapVariantDocument = (
  document: SanityDocument,
  validation: DocumentValidationStatus,
): DocumentInVariant => ({
  memoKey: uuid(),
  document,
  validation,
})

/** @internal */
export const resetVariantDocumentsCacheForTests = resetBundleDocumentsCacheForTests

/**
 * Loads every document that belongs to the given variant, validating each one.
 *
 * @internal
 */
export function useVariantDocuments(variantId?: string): {
  loading: boolean
  results: DocumentInVariant[]
  error: Error | null
} {
  const queryParams = useMemo(() => ({variantId: variantId ?? ''}), [variantId])

  return useBundleDocuments<DocumentInVariant>({
    cacheKey: variantId ?? '',
    enabled: Boolean(variantId),
    groqFilter: VARIANT_DOCUMENTS_GROQ_FILTER,
    queryParams,
    clientOptions: VARIANTS_STUDIO_CLIENT_OPTIONS,
    mapDocument: mapVariantDocument,
  })
}
