import {useCallback} from 'react'

import {useClient} from '../../hooks/useClient'
import {type TargetPerspective} from '../../perspective/types'
import {createVariantScopedDocument} from '../documents/createVariantScopedDocument'
import {VARIANTS_STUDIO_CLIENT_OPTIONS} from '../store/constants'
import {type SystemVariant} from '../types'

/**
 * @internal
 */
export function useVariantDocumentOperations() {
  const client = useClient(VARIANTS_STUDIO_CLIENT_OPTIONS)

  const createVariantDocument = useCallback(
    async (options: {
      baseId: string
      baseRevisionId?: string
      variant: SystemVariant
      selectedPerspective: TargetPerspective
    }) => {
      await createVariantScopedDocument({
        client,
        ...options,
      })
    },
    [client],
  )

  return {createVariantDocument}
}
