import {useMemo} from 'react'

import {useClient} from '../../hooks'
import {useReleasesUpsell} from '../contexts/upsell/useReleasesUpsell'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../util/releasesClient'
import {createReleaseOperationsStore} from './createReleaseOperationStore'

/**
 * @internal
 */
export function useReleaseOperations() {
  const studioClient = useClient(RELEASES_STUDIO_CLIENT_OPTIONS)
  const {onReleaseLimitReached} = useReleasesUpsell()
  return useMemo(
    () =>
      createReleaseOperationsStore({
        client: studioClient,
        onReleaseLimitReached,
      }),
    [onReleaseLimitReached, studioClient],
  )
}
