import {useMemo} from 'react'

import {useClient} from '../../hooks'
import {VARIANTS_STUDIO_CLIENT_OPTIONS} from './constants'
import {createVariantOperationsStore} from './createVariantOperationsStore'

/**
 * @internal
 */
export function useVariantOperations() {
  const studioClient = useClient(VARIANTS_STUDIO_CLIENT_OPTIONS)

  return useMemo(
    () =>
      createVariantOperationsStore({
        client: studioClient,
      }),
    [studioClient],
  )
}
