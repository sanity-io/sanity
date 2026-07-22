import {SingleActionResult} from '@sanity/client'
import {type SanityDocumentLike} from '@sanity/types'
import {useCallback} from 'react'

import {useClient} from '../../hooks'
import {type TargetPerspective} from '../../perspective/types'
import {createVariantScopedDocument} from '../documents/createVariantScopedDocument'
import {VARIANTS_STUDIO_CLIENT_OPTIONS} from '../store/constants'
import {type SystemVariant} from '../types'

/**
 * @internal
 */
export function useVariantDocumentOperations() {
  const client = useClient(VARIANTS_STUDIO_CLIENT_OPTIONS)

  const createVariantDocument = useCallback<
    (
      options: Omit<Parameters<typeof createVariantScopedDocument>[0], 'client'>,
    ) => ReturnType<typeof createVariantScopedDocument>
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
