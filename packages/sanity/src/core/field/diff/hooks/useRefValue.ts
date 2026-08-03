import {useMemo} from 'react'
import {useObservable as useSyncObservable} from 'react-rx'
import {EMPTY} from 'rxjs'

import {useClient} from '../../../hooks/useClient'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'

export function useRefValue<T extends Record<string, any> = Record<string, any>>(
  refId: string | undefined | null,
): T | undefined {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const document$ = useMemo(
    () => (refId ? client.observable.getDocument<T>(refId) : EMPTY),
    [client, refId],
  )
  // Kept synchronous: the falsy-ref guard below reads the live `refId`, so a
  // deferred snapshot could return the previously referenced document under a
  // newly selected ref.
  const value = useSyncObservable(document$)

  // Always return undefined in the case of a falsey ref to prevent bug
  // when going from an ID to an undefined state
  return refId ? value : undefined
}
