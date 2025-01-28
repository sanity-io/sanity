import {useMemo} from 'react'

import {useClient} from '../../hooks'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {useReleasesUpsell} from '../contexts/upsell/useReleasesUpsell'
import {createReleaseOperationsStore} from './createReleaseOperationStore'

/**
 * @internal
 */
export function useReleaseOperations() {
  const studioClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const {setUpsellLimit} = useReleasesUpsell()
  return useMemo(
    () =>
      createReleaseOperationsStore({
        client: studioClient,
        onLimitReached: setUpsellLimit,
      }),
    [setUpsellLimit, studioClient],
  )
}
