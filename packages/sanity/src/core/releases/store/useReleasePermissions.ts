import {useMemo} from 'react'

import {useClient} from '../../hooks'
import {useReleasesUpsell} from '../contexts/upsell/useReleasesUpsell'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../util/releasesClient'
import {createReleasePermissionsStore} from './createReleasePermissionsStore'

/**
 * @internal
 */
export function useReleasePermissions() {
  const studioClient = useClient(RELEASES_STUDIO_CLIENT_OPTIONS)
  const {onReleaseLimitReached} = useReleasesUpsell()
  return useMemo(
    () =>
      createReleasePermissionsStore({
        client: studioClient,
        onReleaseLimitReached,
      }),
    [onReleaseLimitReached, studioClient],
  )
}
