import {useMemo} from 'react'

import {useClient} from '../../hooks'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {createReleaseOperationsStore} from './createReleaseOperationStore'

/**
 * @internal
 */
export function useReleaseOperations() {
  const studioClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  return useMemo(
    () =>
      createReleaseOperationsStore({
        client: studioClient,
      }),
    [studioClient],
  )
}
