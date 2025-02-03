import {useMemo} from 'react'

import {useClient} from '../../hooks'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../util/releasesClient'
import {createReleaseOperationsStore} from './createReleaseOperationStore'

/**
 * @internal
 */
export function useReleaseOperations() {
  const studioClient = useClient(RELEASES_STUDIO_CLIENT_OPTIONS)
  return useMemo(
    () =>
      createReleaseOperationsStore({
        client: studioClient,
      }),
    [studioClient],
  )
}
