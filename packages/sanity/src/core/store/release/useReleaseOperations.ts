import {useMemo} from 'react'

import {useClient} from '../../hooks'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {useCurrentUser} from '../user'
import {createReleaseOperationsStore} from './createReleaseOperationStore'

/**
 * @internal
 */
export function useReleaseOperations() {
  const studioClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const currentUser = useCurrentUser()

  return useMemo(
    () =>
      createReleaseOperationsStore({
        client: studioClient,
        // todo: is this non-null assertion safe?
        currentUser: currentUser!,
      }),
    [currentUser, studioClient],
  )
}
