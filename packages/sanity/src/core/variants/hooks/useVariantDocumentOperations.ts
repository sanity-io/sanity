import {type MultipleActionResult, type SingleActionResult} from '@sanity/client'
import {useCallback} from 'react'

import {useClient} from '../../hooks/useClient'
import {
  createVariantScopedDocument,
  type CreateVariantScopedDocumentOptions,
} from '../documents/createVariantScopedDocument'
import {duplicateVariantDocuments as duplicateVariantDocumentsWithClient} from '../documents/duplicateVariantDocuments'
import {type VariantDocumentDuplicate} from '../documents/getVariantDocumentDuplicationPlan'
import {VARIANTS_STUDIO_CLIENT_OPTIONS} from '../store/constants'
import {type SystemVariant} from '../types'

type DistributiveOmit<Type, Key extends PropertyKey> = Type extends unknown
  ? Omit<Type, Key>
  : never

/**
 * @internal
 */
export function useVariantDocumentOperations() {
  const client = useClient(VARIANTS_STUDIO_CLIENT_OPTIONS)

  const createVariantDocument = useCallback<
    (
      options: DistributiveOmit<CreateVariantScopedDocumentOptions, 'client'>,
    ) => Promise<SingleActionResult>
  >(
    (options) =>
      createVariantScopedDocument({
        client,
        ...options,
      }),
    [client],
  )

  const duplicateVariantDocuments = useCallback(
    (options: {
      variant: Pick<SystemVariant, '_id'>
      documents: VariantDocumentDuplicate[]
    }): Promise<MultipleActionResult | undefined> =>
      duplicateVariantDocumentsWithClient({client, ...options}),
    [client],
  )

  return {createVariantDocument, duplicateVariantDocuments}
}
