import {type SingleActionResult} from '@sanity/client'
import {useCallback} from 'react'

import {useClient} from '../../hooks/useClient'
import {
  createVariantScopedDocument,
  type CreateVariantScopedDocumentOptions,
} from '../documents/createVariantScopedDocument'
import {VARIANTS_STUDIO_CLIENT_OPTIONS} from '../store/constants'

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

  return {createVariantDocument}
}
